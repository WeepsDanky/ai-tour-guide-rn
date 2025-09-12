# src/services/orchestrator.py
import asyncio
import json
import base64
import uuid
from typing import AsyncGenerator, Dict, Any, List
from datetime import datetime
import aiohttp
from fastapi import WebSocket
from ..schemas.guide import (
    InitMessage, MetaMessage, TextMessage, EosMessage, ErrorMessage,
    AudioSegmentInfo
)
from ..core.config import settings

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
    
    async def stream(self):
        """Main streaming orchestration method"""
        try:
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
            
        except Exception as e:
            await self._send_error_message("STREAM_ERROR", str(e))
    
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
        await self.ws.send_json(meta.model_dump())
    
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
        这是一个需要介绍的地点。请为游客提供有趣且信息丰富的导览解说。
        包括历史背景、文化意义、建筑特色等内容。
        语言风格要生动有趣，适合导游解说。
        """
        
        return context
    
    async def _stream_and_chunk_llm(self, context: str) -> AsyncGenerator[str, None]:
        """Stream from LLM and chunk into sentences"""
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": "gpt-4",  # Replace with actual model
                    "messages": [
                        {
                            "role": "system",
                            "content": "你是一位专业的导游，为游客提供生动有趣的景点介绍。"
                        },
                        {
                            "role": "user", 
                            "content": context
                        }
                    ],
                    "stream": True,
                    "max_tokens": 2000,
                    "temperature": 0.7
                }
                
                headers = {
                    "Authorization": f"Bearer {settings.LLM_API_KEY}",
                    "Content-Type": "application/json"
                }
                
                async with session.post(
                    settings.LLM_ENDPOINT,
                    json=payload,
                    headers=headers
                ) as response:
                    if response.status != 200:
                        yield "抱歉，无法获取导览信息。"
                        return
                    
                    buffer = ""
                    async for line in response.content:
                        if line:
                            line_str = line.decode('utf-8').strip()
                            if line_str.startswith('data: '):
                                data_str = line_str[6:]
                                if data_str == '[DONE]':
                                    break
                                
                                try:
                                    data = json.loads(data_str)
                                    delta = data.get('choices', [{}])[0].get('delta', {}).get('content', '')
                                    if delta:
                                        buffer += delta
                                        
                                        # Check for sentence endings
                                        sentences = self._extract_sentences(buffer)
                                        for sentence in sentences[:-1]:  # Keep last partial sentence in buffer
                                            yield sentence
                                        buffer = sentences[-1] if sentences else ""
                                        
                                except json.JSONDecodeError:
                                    continue
                    
                    # Yield remaining buffer
                    if buffer.strip():
                        yield buffer
                        
        except Exception as e:
            print(f"LLM streaming error: {e}")
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
        await self.ws.send_json(message.model_dump())
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
                await self.ws.send_bytes(header + audio_bytes)
                
                # Update tracking
                self.segments.append(segment_info)
                self.total_duration_ms = segment_info.end_ms
                self.sequence_counter += 1
                
                # Store in Supabase storage (non-blocking)
                asyncio.create_task(self._store_audio_segment(segment_info, audio_bytes))
                
        except Exception as e:
            print(f"Audio processing error: {e}")
    
    async def _generate_audio(self, text: str) -> bytes:
        """Generate audio from text using TTS service"""
        try:
            # Placeholder for TTS API call
            # In a real implementation, call your TTS service here
            async with aiohttp.ClientSession() as session:
                payload = {
                    "text": text,
                    "voice": "zh-CN-XiaoxiaoNeural",  # Example voice
                    "format": "mp3",
                    "rate": "0%",
                    "pitch": "0%"
                }
                
                headers = {
                    "Authorization": f"Bearer {settings.TTS_API_KEY}",
                    "Content-Type": "application/json"
                }
                
                # Replace with actual TTS endpoint
                async with session.post(
                    "https://api.tts-service.com/synthesize",
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        return await response.read()
                    else:
                        print(f"TTS API error: {response.status}")
                        return b""
                        
        except Exception as e:
            print(f"TTS generation error: {e}")
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
            
            if result.get("error"):
                print(f"Storage upload error: {result['error']}")
                
        except Exception as e:
            print(f"Storage error: {e}")
    
    async def _send_eos_message(self):
        """Send end of stream message"""
        message = EosMessage(
            type="eos",
            guideId=self.guide_id,
            totalDurationMs=self.total_duration_ms,
            transcript="".join(self.transcript_parts)
        )
        await self.ws.send_json(message.model_dump())
    
    async def _send_error_message(self, code: str, message: str):
        """Send error message to client"""
        error = ErrorMessage(
            type="error",
            code=code,
            message=message
        )
        await self.ws.send_json(error.model_dump())
