# src/services/vision.py
import base64
import json
import asyncio
from typing import List
import aiohttp
from ..schemas.guide import IdentifyRequest, Candidate
from ..core.config import settings
import logging

class VisionService:
    """Service for image identification using Vision LLM"""
    
    def __init__(self):
        self.llm_endpoint = settings.LLM_ENDPOINT
        self.api_key = settings.LLM_API_KEY
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
            # Normalize and validate base64 (support data URLs and missing padding)
            normalized_b64 = self._normalize_base64(request.imageBase64)
            try:
                _ = base64.b64decode(normalized_b64)
            except Exception as dec_err:
                self.logger.warning("base64 decode warning; proceeding with normalized string", extra={"error": str(dec_err)})
            
            # Prepare the prompt for vision LLM
            prompt = self._create_vision_prompt(request.geo.lat, request.geo.lng)
            
            # Call external Vision LLM API
            candidates = await self._call_vision_api(normalized_b64, prompt)
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

    async def _call_vision_api(self, image_base64: str, prompt: str) -> List[Candidate]:
        """
        Call external vision API
        
        Args:
            image_base64: Base64 encoded image
            prompt: Analysis prompt
            
        Returns:
            List of candidates
        """
        try:
            self.logger.debug("calling vision API")
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": "vision-model",  # Replace with actual model name
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{image_base64}"
                                    }
                                }
                            ]
                        }
                    ],
                    "max_tokens": 1000,
                    "temperature": 0.7
                }
                
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                
                async with session.post(
                    self.llm_endpoint,
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return self._parse_vision_response(result)
                    else:
                        self.logger.warning("vision API non-200", extra={"status": response.status})
                        return self._get_fallback_candidates()
                        
        except asyncio.TimeoutError:
            self.logger.warning("vision API timeout")
            return self._get_fallback_candidates()
        except Exception as e:
            self.logger.exception(f"vision API call error: {e}")
            return self._get_fallback_candidates()
    
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
            content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
            
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
                spot="未知地点",
                confidence=0.1,
                bbox=None
            )
        ]

# Global instance
vision_service = VisionService()
