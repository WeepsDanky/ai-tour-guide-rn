# src/services/orchestrator.py
import asyncio
import json
import base64
import uuid
from typing import AsyncGenerator, Dict, Any, List
from datetime import datetime
from any_llm import aresponses
from openai import AsyncOpenAI
from fastapi import WebSocket
from starlette.websockets import WebSocketState
from ..schemas.guide import (
    InitMessage, MetaMessage, TextMessage, EosMessage, ErrorMessage,
    AudioSegmentInfo
)
from ..core.config import settings
from ..mappers.guide_mapper import GuideMapper
from ..core.supabase import supabase_admin
import logging

class NarrativeOrchestrator:
    """Orchestrates the complete guide streaming process"""
    
    def __init__(self, websocket: WebSocket, init_data: InitMessage):
        self.ws = websocket
        self.init_data = init_data
        self.guide_id = f"guide_{uuid.uuid4().hex[:12]}"
        self.sequence_counter = 0
        self.segments: List[AudioSegmentInfo] = []
        self.transcript_parts: List[str] = []
        self.total_duration_ms = 0
        self.logger = logging.getLogger("service.orchestrator")
        self.llm_provider = "openai"
        self.tts_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.guide_mapper = GuideMapper(supabase_admin)
    
    async def stream(self):
        """Main streaming orchestration method"""
        try:
            self.logger.info("orchestrator start", extra={
                "guideId": self.guide_id,
                "deviceId": self.init_data.deviceId,
                "lat": self.init_data.geo.lat,
                "lng": self.init_data.geo.lng,
            })
            # 1. Send early meta message
            await self._send_meta_message()
            
            # 2. Perform RAG to get context
            context = await self._get_location_context()
            
            # 3. Stream narrative from LLM and process in parallel
            async for sentence in self._stream_and_chunk_llm(context):
                if sentence.strip():
                    # 4a. Send text delta immediately
                    await self._send_text_delta(sentence)
                    
                    # 4b. Generate and send audio in parallel
                    await self._process_audio_segment(sentence)
            
            # 5. Send end of stream message
            await self._send_eos_message()
            self.logger.info("orchestrator completed", extra={
                "guideId": self.guide_id,
                "segments": len(self.segments),
                "durationMs": self.total_duration_ms,
            })
            
        except Exception as e:
            self.logger.exception(f"orchestrator error: {e}")
            try:
                await self._send_error_message("STREAM_ERROR", str(e))
            except Exception:
                # Ignore if client already disconnected
                pass
    
    async def _send_meta_message(self):
        """Send metadata about the guide"""
        meta = MetaMessage(
            type="meta",
            guideId=self.guide_id,
            title=f"探索{self.init_data.geo.lat:.4f}, {self.init_data.geo.lng:.4f}",
            spot="正在识别...",
            confidence=0.8,
            estimatedDurationMs=120000  # 2 minutes estimate
        )
        await self._safe_send_json(meta.model_dump())
        self.logger.info("meta sent", extra={"guideId": self.guide_id, "title": meta.title})
    
    async def _get_location_context(self) -> str:
        """Perform RAG to get relevant context for the location"""
        # This is a placeholder - in a real implementation, you would:
        # 1. Use the image and coordinates to identify the location
        # 2. Query a knowledge base or external APIs for relevant information
        # 3. Return structured context for the LLM
        
        lat, lng = self.init_data.geo.lat, self.init_data.geo.lng
        
        # Simulate context retrieval
        context = f"""
        Location: 纬度 {lat}, 经度 {lng}
        这是一个需要介绍的地点。请主要根据图片内容（先描述图片内容），地理坐标为辅。为游客提供有趣且信息丰富的导览解说
        包括历史背景、文化意义、建筑特色等内容。
        语言风格地道一些，像一个长久住在附近的东北人给你讲解。
        """
        
        return context
    
    async def _stream_and_chunk_llm(self, context: str) -> AsyncGenerator[str, None]:
        """Call any_llm Responses API and chunk full output into sentences"""
        try:
            self.logger.info("LLM stream begin", extra={"guideId": self.guide_id})
            # Use Responses API (non-streaming) for simpler, faster integration
            result = await aresponses(
                provider=self.llm_provider,
                model="gpt-5-nano",
                input_data=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "input_text", "text": context},
                        ],
                    }
                ],
                instructions="你是一位本地人，为朋友提供有意思且简单的景点介绍。",
                reasoning={"effort": "low"},
                text={"verbosity": "low"},
                max_output_tokens=1000,
                api_key=settings.OPENAI_API_KEY,
            )
            full_text = getattr(result, "output_text", None) or ""
            if not full_text.strip():
                return
            sentences = self._extract_sentences(full_text)
            for sentence in sentences:
                if sentence and sentence.strip():
                    yield sentence
        except Exception as e:
            self.logger.exception(f"LLM streaming error: {e}")
            yield "抱歉，导览服务暂时不可用。"
    
    def _extract_sentences(self, text: str) -> List[str]:
        """Extract complete sentences from text buffer"""
        # Simple sentence splitting - can be improved with proper NLP
        import re
        sentences = re.split(r'[。！？；]', text)
        
        # Add punctuation back except for the last incomplete sentence
        result = []
        for i, sentence in enumerate(sentences[:-1]):
            if sentence.strip():
                # Find the original punctuation
                punct_match = re.search(r'[。！？；]', text[len(''.join(sentences[:i+1])):])
                punct = punct_match.group() if punct_match else '。'
                result.append(sentence.strip() + punct)
        
        # Add the incomplete sentence
        if sentences[-1].strip():
            result.append(sentences[-1])
        
        return result if result else [text]
    
    async def _send_text_delta(self, text: str):
        """Send text delta to client"""
        message = TextMessage(type="text", delta=text)
        await self._safe_send_json(message.model_dump())
        self.logger.debug("text delta sent", extra={"len": len(text)})
        self.transcript_parts.append(text)
    
    async def _process_audio_segment(self, text: str):
        """Generate audio for text segment and send to client"""
        try:
            # Generate audio
            audio_bytes = await self._generate_audio(text)
            
            if audio_bytes:
                # Create segment info
                segment_info = AudioSegmentInfo(
                    seq=self.sequence_counter,
                    start_ms=self.total_duration_ms,
                    end_ms=self.total_duration_ms + len(audio_bytes) * 8,  # Rough estimate
                    format="mp3",
                    bitrate_kbps=128,
                    bytes_len=len(audio_bytes),
                    object_key=f"{self.guide_id}/{self.sequence_counter:04d}.mp3"
                )
                
                # Send binary audio data
                header = self._create_binary_header(segment_info)
                await self._safe_send_bytes(header + audio_bytes)
                self.logger.info("audio segment sent", extra={
                    "seq": segment_info.seq,
                    "bytes": segment_info.bytes_len,
                })
                
                # Update tracking
                self.segments.append(segment_info)
                self.total_duration_ms = segment_info.end_ms
                self.sequence_counter += 1
                
                # Store in Supabase storage (non-blocking)
                asyncio.create_task(self._store_audio_segment(segment_info, audio_bytes))
                
        except Exception as e:
            self.logger.exception(f"Audio processing error: {e}")
    
    async def _generate_audio(self, text: str) -> bytes:
        """Generate audio from text using OpenAI TTS"""
        try:
            resp = await self.tts_client.audio.speech.create(
                model="tts-1",
                voice="alloy",
                input=text,
                response_format="mp3",
            )
            # The SDK returns a streaming/binary content wrapper
            try:
                content = await resp.content.read()  # type: ignore[attr-defined]
            except Exception:
                # Fallback for older SDKs that return bytes directly
                content = getattr(resp, "content", b"")
            return content or b""
        except Exception as e:
            self.logger.exception(f"TTS generation error: {e}")
            return b""
    
    def _create_binary_header(self, segment_info: AudioSegmentInfo) -> bytes:
        """Create binary header for audio segment"""
        # Create a simple header with segment info
        header_data = {
            "seq": segment_info.seq,
            "start_ms": segment_info.start_ms,
            "end_ms": segment_info.end_ms,
            "format": segment_info.format,
            "bytes_len": segment_info.bytes_len
        }
        
        header_json = json.dumps(header_data, separators=(',', ':'))
        header_bytes = header_json.encode('utf-8')
        
        # 4-byte length prefix + header
        length_prefix = len(header_bytes).to_bytes(4, byteorder='big')
        return length_prefix + header_bytes
    
    async def _store_audio_segment(self, segment_info: AudioSegmentInfo, audio_bytes: bytes):
        """Store audio segment in Supabase storage"""
        try:
            from ..core.supabase import supabase_admin
            
            # Upload to storage
            result = supabase_admin.storage.from_(settings.SUPABASE_STORAGE_BUCKET_AUDIO).upload(
                segment_info.object_key,
                audio_bytes,
                {"content-type": "audio/mpeg"}
            )
            
            # Handle SDK response object (no dict .get())
            error_attr = getattr(result, "error", None)
            if error_attr:
                self.logger.warning("storage upload error", extra={"error": str(error_attr)})
                
        except Exception as e:
            self.logger.exception(f"Storage error: {e}")
    
    async def _send_eos_message(self):
        """Send end of stream message and persist guide + segments"""
        transcript = "".join(self.transcript_parts)
        message = EosMessage(
            type="eos",
            guideId=self.guide_id,
            totalDurationMs=self.total_duration_ms,
            transcript=transcript
        )
        await self._safe_send_json(message.model_dump())
        self.logger.info("eos sent", extra={
            "guideId": self.guide_id,
            "totalDurationMs": self.total_duration_ms,
        })
        # Persist to DB
        try:
            await self.guide_mapper.create_guide(
                guide_id=self.guide_id,
                device_id=self.init_data.deviceId,
                spot="",
                title=f"探索{self.init_data.geo.lat:.4f}, {self.init_data.geo.lng:.4f}",
                transcript=transcript,
                duration_ms=self.total_duration_ms,
            )
            if self.segments:
                await self.guide_mapper.create_guide_segments_batch(
                    segments=self.segments,
                    guide_id=self.guide_id,
                )
        except Exception as e:
            self.logger.exception(f"persist guide failed: {e}")
    
    async def _send_error_message(self, code: str, message: str):
        """Send error message to client"""
        error = ErrorMessage(
            type="error",
            code=code,
            message=message
        )
        await self._safe_send_json(error.model_dump())
        self.logger.error("error message sent", extra={"code": code, "message": message})

    async def _safe_send_json(self, payload: dict) -> None:
        """Send JSON only if socket is connected; swallow send errors."""
        try:
            if getattr(self.ws, "client_state", None) is not None:
                if self.ws.client_state != WebSocketState.CONNECTED:
                    return
        except Exception:
            # If client_state not available, proceed and rely on exception handling
            pass
        try:
            await self.ws.send_json(payload)
        except Exception as e:
            self.logger.debug(f"safe send_json failed: {e}")

    async def _safe_send_bytes(self, data: bytes) -> None:
        """Send bytes only if socket is connected; swallow send errors."""
        try:
            if getattr(self.ws, "client_state", None) is not None:
                if self.ws.client_state != WebSocketState.CONNECTED:
                    return
        except Exception:
            pass
        try:
            await self.ws.send_bytes(data)
        except Exception as e:
            self.logger.debug(f"safe send_bytes failed: {e}")
