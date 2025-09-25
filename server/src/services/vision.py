# src/services/vision.py
import base64
import json
import asyncio
from typing import List, Optional
from any_llm import aresponses
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
        """
        try:
            image_input: Optional[str] = None
            input_is_url: bool = False

            if request.imageBase64:
                # Accept only base64 from frontend as-is
                image_input = request.imageBase64
                input_is_url = False
            elif request.imageUrl:
                # Only base64 is accepted to simplify the pipeline
                raise self.VisionAPIError("Only base64 image is accepted")
            else:
                raise self.VisionAPIError("Either imageBase64 or imageUrl must be provided")

            if not settings.OPENAI_API_KEY:
                raise self.VisionAPIError("OPENAI_API_KEY not configured")

            prompt = self._create_vision_prompt(request.geo.lat, request.geo.lng)
            candidates = await self._call_vision_api(image_input, prompt, input_is_url)
            return candidates

        except VisionService.VisionAPIError:
            # Propagate known vision errors to be handled at API layer
            raise
        except Exception as e:
            # Wrap unexpected errors so API layer can return proper error response
            raise self.VisionAPIError(str(e))
    
    def _create_vision_prompt(self, lat: float, lng: float) -> str:
        """Create concise prompt for faster vision LLM response"""
        return (
            f"位置: lat {lat}, lng {lng}. "
            "请识别图像中的地标或景点。"
            "仅返回JSON: {\"candidates\":[{\"spot\":string,\"confidence\":number,\"bbox\"?:any}]}"
        )
    
    # Normalization removed: we accept only one base64 type from frontend

    async def _call_vision_api(self, image_input: str, prompt: str, input_is_url: bool) -> List[Candidate]:
        """Call external vision API using any_llm Responses API (OpenAI provider).

        image_input: base64 (no data: prefix) or https URL when input_is_url=True
        """
        try:
            self.logger.info("vision request posted")
            user_content = [
                {"type": "input_text", "text": prompt},
            ]
            # Attach image if present
            if image_input:
                user_content.append(
                    {
                        "type": "input_image",
                        "image_url": image_input if input_is_url else f"data:image/jpeg;base64,{image_input}"
                    }
                )

            # Enforce upstream timeout to avoid client-side request timeouts
            result = await asyncio.wait_for(
                aresponses(
                    provider="openai",
                    model="gpt-5-nano",
                    input_data=[
                        {
                            "role": "user",
                            "content": user_content,
                        }
                    ],
                    instructions=(
                        "Return only compact JSON with keys: candidates:[{spot,confidence,bbox?}]."
                    ),
                    reasoning={"effort": "minimal"},
                    text={"verbosity": "low"},
                    max_output_tokens=800,
                    api_key=settings.OPENAI_API_KEY,
                ),
                timeout=30,
            )
            content = getattr(result, "output_text", "")
            # Only log the final result
            self.logger.info(f"vision response result: {content}")
            return self._parse_vision_response({"content": content})
        except asyncio.TimeoutError:
            self.logger.error("vision error: timeout")
            return []
        except Exception as e:
            self.logger.error(f"vision error: {e}")
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
                return candidates
            else:
                # Not JSON
                return []
                
        except (json.JSONDecodeError, KeyError, ValueError):
            return []

# Global instance
vision_service = VisionService()
