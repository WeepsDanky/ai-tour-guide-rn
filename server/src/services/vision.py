# src/services/vision.py
import base64
import json
import asyncio
from typing import List, Optional
from any_llm import acompletion
from ..core.config import settings
from ..schemas.guide import IdentifyRequest, Candidate
import logging

class VisionService:
    class VisionAPIError(Exception):
        pass
    """Service for image identification using Vision LLM"""
    
    def __init__(self):
        self.logger = logging.getLogger("service.vision")
    
    async def identify_location(self, request: IdentifyRequest) -> List[Candidate]:
        """
        Identify location from image and geographic coordinates
        
        Args:
            request: IdentifyRequest containing image and location data
            
        Returns:
            List of location candidates with confidence scores
        """
        try:
            self.logger.info("vision identify start", extra={
                "deviceId": request.deviceId,
                "lat": request.geo.lat,
                "lng": request.geo.lng,
            })
            image_input: Optional[str] = None
            input_is_url: bool = False
            
            if request.imageBase64:
                # Normalize and validate base64 (support data URLs and missing padding)
                normalized_b64 = self._normalize_base64(request.imageBase64)
                try:
                    _ = base64.b64decode(normalized_b64)
                except Exception as dec_err:
                    self.logger.warning("base64 decode warning; proceeding with normalized string", extra={"error": str(dec_err)})
                image_input = normalized_b64
                input_is_url = False
            elif request.imageUrl:
                image_input = request.imageUrl.strip()
                input_is_url = True
            else:
                raise self.VisionAPIError("Either imageBase64 or imageUrl must be provided")
            
            # Prepare the prompt for vision LLM
            prompt = self._create_vision_prompt(request.geo.lat, request.geo.lng)
            
            # Call external Vision LLM API
            candidates = await self._call_vision_api(image_input, prompt, input_is_url)
            self.logger.info("vision identify success", extra={
                "numCandidates": len(candidates) if candidates else 0,
            })
            
            return candidates
            
        except Exception as e:
            self.logger.exception(f"vision identify error: {e}")
            # Return fallback candidate if vision fails
            return [
                Candidate(
                    spot="未知地点",
                    confidence=0.1,
                    bbox=None
                )
            ]
    
    def _create_vision_prompt(self, lat: float, lng: float) -> str:
        """Create prompt for vision LLM based on location"""
        return f"""
        请分析这张图片，识别其中的地标、建筑物或景点。
        图片拍摄位置大约在纬度 {lat}，经度 {lng}。
        
        请返回JSON格式的结果，包含以下字段：
        - candidates: 候选地点列表
        - 每个候选地点包含：
          - spot: 地点名称
          - confidence: 置信度 (0-1)
          - bbox: 边界框坐标 (可选)
        
        示例格式：
        {{
            "candidates": [
                {{
                    "spot": "天安门广场",
                    "confidence": 0.95,
                    "bbox": {{"x": 100, "y": 50, "width": 200, "height": 150}}
                }}
            ]
        }}
        """
    
    def _normalize_base64(self, image_base64: str) -> str:
        """Accept data URLs and raw base64; strip whitespace; fix padding."""
        s = (image_base64 or "").strip()
        if s.startswith("data:"):
            if "," in s:
                s = s.split(",", 1)[1]
        s = s.replace("\n", "").replace("\r", "").replace(" ", "")
        missing = (-len(s)) % 4
        if missing:
            s += "=" * missing
        return s

    async def _call_vision_api(self, image_input: str, prompt: str, input_is_url: bool) -> List[Candidate]:
        """Call external vision API using any_llm (OpenAI provider).

        image_input: base64 (no data: prefix) or https URL when input_is_url=True
        """
        try:
            self.logger.debug("calling vision API with any_llm")
            response = await acompletion(
                provider="openai",
                model="gpt-4.1",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": image_input if input_is_url else f"data:image/jpeg;base64,{image_input}"
                                },
                            },
                        ],
                    }
                ],
                max_tokens=1000,
                temperature=0.7,
                response_format={"type": "json_object"},
                api_key=settings.OPENAI_API_KEY,
            )
            content = response.choices[0].message.content
            return self._parse_vision_response({"content": content})
        except asyncio.TimeoutError:
            self.logger.warning("vision API timeout")
            raise self.VisionAPIError("Vision service timeout")
        except Exception as e:
            self.logger.exception(f"vision API call error: {e}")
            # Try to surface OpenAI error message if available
            try:
                msg = str(getattr(e, "message", None) or getattr(e, "error", None) or e)
            except Exception:
                msg = str(e)
            raise self.VisionAPIError(msg)
    
    def _parse_vision_response(self, response: dict) -> List[Candidate]:
        """
        Parse response from vision API
        
        Args:
            response: API response dictionary
            
        Returns:
            List of candidates
        """
        try:
            # Extract content from response
            content = response.get("content", "")
            
            # Try to parse as JSON
            if content.strip().startswith("{"):
                data = json.loads(content)
                candidates_data = data.get("candidates", [])
                
                candidates = []
                for candidate_data in candidates_data:
                    candidate = Candidate(
                        spot=candidate_data.get("spot", "未知地点"),
                        confidence=float(candidate_data.get("confidence", 0.5)),
                        bbox=candidate_data.get("bbox")
                    )
                    candidates.append(candidate)
                
                return candidates if candidates else self._get_fallback_candidates()
            else:
                # If not JSON, try to extract location name from text
                return [
                    Candidate(
                        spot=content[:50] if content else "未知地点",
                        confidence=0.6,
                        bbox=None
                    )
                ]
                
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            self.logger.exception(f"error parsing vision response: {e}")
            return self._get_fallback_candidates()
    
    def _get_fallback_candidates(self) -> List[Candidate]:
        """Return fallback candidates when vision fails"""
        return [
            Candidate(
                spot="识别失败未知",
                confidence=0.1,
                bbox=None
            )
        ]

# Global instance
vision_service = VisionService()
