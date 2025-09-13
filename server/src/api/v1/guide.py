# src/api/v1/guide.py
import uuid
import json
from typing import Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.responses import JSONResponse
import logging

from ...schemas import guide as guide_schemas
from ...services.vision import vision_service
from ...services.orchestrator import NarrativeOrchestrator
from ...mappers.guide_mapper import GuideMapper
from ..deps import get_guide_mapper
from ...core.supabase import supabase_admin
from ...core.config import settings

router = APIRouter(prefix="/guide", tags=["guide"])
logger = logging.getLogger("api.guide")

@router.post("/identify", response_model=guide_schemas.IdentifyResponse)
async def identify(
    request: guide_schemas.IdentifyRequest,
    mapper: GuideMapper = Depends(get_guide_mapper)
):
    """
    Identify location from image and geographic coordinates
    
    This endpoint processes an uploaded image along with GPS coordinates
    to identify possible locations or landmarks.
    """
    try:
        logger.info("POST /guide/identify start", extra={
            "deviceId": request.deviceId,
            "lat": request.geo.lat,
            "lng": request.geo.lng,
            "accuracyM": request.geo.accuracyM,
        })
        # Generate unique identify session ID
        identify_id = f"id_{uuid.uuid4().hex[:12]}"
        
        # Call vision service to identify location
        try:
            candidates = await vision_service.identify_location(request)
        except vision_service.VisionAPIError as e:  # type: ignore[attr-defined]
            logger.warning("Vision identify failed", extra={"error": str(e)})
            # Surface error to client
            return JSONResponse(status_code=400, content={
                "identifyId": "",
                "candidates": [],
                "error": {"type": "vision", "message": str(e)}
            })
        logger.info("Vision candidates returned", extra={
            "identifyId": identify_id,
            "numCandidates": len(candidates) if candidates else 0,
        })
        
        # Store the identify session in database
        best_candidate = candidates[0] if candidates else None
        await mapper.create_identify_session(
            identify_id=identify_id,
            device_id=request.deviceId,
            lat=request.geo.lat,
            lng=request.geo.lng,
            accuracy_m=request.geo.accuracyM,
            spot=best_candidate.spot if best_candidate else None,
            confidence=best_candidate.confidence if best_candidate else None,
            bbox=best_candidate.bbox if best_candidate else None
        )
        
        response = guide_schemas.IdentifyResponse(
            identifyId=identify_id,
            candidates=candidates
        )
        logger.info("POST /guide/identify success", extra={
            "identifyId": identify_id,
            "bestSpot": best_candidate.spot if best_candidate else None,
            "confidence": best_candidate.confidence if best_candidate else None,
        })
        return response
        
    except Exception as e:
        logger.exception(f"POST /guide/identify failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to identify location"
        )

@router.websocket("/stream")
async def guide_stream(websocket: WebSocket):
    """
    WebSocket endpoint for streaming guide narratives
    
    This endpoint handles the real-time streaming of guide content,
    including text and audio segments.
    """
    await websocket.accept()
    conn_id = uuid.uuid4().hex[:8]
    ws_logger = logging.getLogger("ws.guide")
    ws_logger.info(f"WS[{conn_id}] connected")
    
    try:
        orchestrator = None
        
        while True:
            # Receive message from client
            try:
                message_data = await websocket.receive_json()
            except Exception as e:
                ws_logger.exception(f"WS[{conn_id}] receive error: {e}")
                break
            
            message_type = message_data.get("type")
            
            if message_type == "init":
                try:
                    # Parse and validate init message
                    init_message = guide_schemas.InitMessage(**message_data)
                    ws_logger.info(f"WS[{conn_id}] init received", extra={
                        "deviceId": init_message.deviceId,
                        "lat": init_message.geo.lat,
                        "lng": init_message.geo.lng,
                        "hasIdentifyId": bool(init_message.identifyId),
                    })
                    # Create orchestrator and start streaming
                    orchestrator = NarrativeOrchestrator(websocket, init_message)
                    await orchestrator.stream()
                    
                except Exception as e:
                    ws_logger.exception(f"WS[{conn_id}] init handling error: {e}")
                    err = {
                        "type": "error",
                        "code": "INIT_ERROR",
                        "message": f"Failed to initialize guide stream: {str(e)}"
                    }
                    ws_logger.error(f"WS[{conn_id}] send -> {err}")
                    await websocket.send_json(err)
                    
            elif message_type == "replay":
                try:
                    replay_message = guide_schemas.ReplayMessage(**message_data)
                    ws_logger.info(f"WS[{conn_id}] replay request", extra={
                        "guideId": replay_message.guideId,
                        "fromMs": replay_message.fromMs,
                    })
                    await handle_replay(websocket, replay_message)
                except Exception as e:
                    ws_logger.exception(f"WS[{conn_id}] replay handling error: {e}")
                    err = {
                        "type": "error",
                        "code": "REPLAY_ERROR",
                        "message": f"Failed to replay guide: {str(e)}"
                    }
                    ws_logger.error(f"WS[{conn_id}] send -> {err}")
                    await websocket.send_json(err)
                    
            elif message_type == "nack":
                try:
                    nack_message = guide_schemas.NackMessage(**message_data)
                    ws_logger.info(f"WS[{conn_id}] nack request", extra={
                        "seq": nack_message.seq,
                    })
                    await handle_nack(websocket, nack_message)
                except Exception as e:
                    ws_logger.exception(f"WS[{conn_id}] nack handling error: {e}")
                    err = {
                        "type": "error",
                        "code": "NACK_ERROR",
                        "message": f"Failed to handle nack: {str(e)}"
                    }
                    ws_logger.error(f"WS[{conn_id}] send -> {err}")
                    await websocket.send_json(err)
                    
            elif message_type == "close":
                try:
                    close_message = guide_schemas.CloseMessage(**message_data)
                    ws_logger.info(f"WS[{conn_id}] client requested close")
                    break
                except Exception as e:
                    ws_logger.exception(f"WS[{conn_id}] close handling error: {e}")
                    break
                    
            else:
                ws_logger.warning(f"WS[{conn_id}] unknown message type: {message_type}")
                err = {
                    "type": "error",
                    "code": "UNKNOWN_MESSAGE_TYPE",
                    "message": f"Unknown message type: {message_type}"
                }
                ws_logger.error(f"WS[{conn_id}] send -> {err}")
                await websocket.send_json(err)
                
    except WebSocketDisconnect:
        ws_logger.info(f"WS[{conn_id}] disconnected")
    except Exception as e:
        ws_logger.exception(f"WS[{conn_id}] unexpected error: {e}")
        try:
            err = {
                "type": "error",
                "code": "INTERNAL_ERROR",
                "message": "Internal server error"
            }
            ws_logger.error(f"WS[{conn_id}] send -> {err}")
            await websocket.send_json(err)
        except:
            pass  # Connection might be closed
    finally:
        try:
            await websocket.close()
        except:
            pass

async def handle_replay(websocket: WebSocket, replay_message: guide_schemas.ReplayMessage):
    """
    Handle replay request for a specific guide
    
    Args:
        websocket: WebSocket connection
        replay_message: Replay request message
    """
    try:
        ws_logger = logging.getLogger("ws.guide.replay")
        guide_id = replay_message.guideId
        from_ms = replay_message.fromMs
        mapper = GuideMapper(supabase_admin)

        segments = await mapper.get_guide_segments(guide_id)
        if not segments:
            err = {"type": "error", "code": "NOT_FOUND", "message": "Guide not found"}
            logging.getLogger("ws.guide.replay").error(f"send -> {err}")
            await websocket.send_json(err)
            return

        sent_any = False
        for segment in segments:
            # Stream segments whose end is after the desired start time
            if segment.end_ms is None or segment.end_ms > from_ms:
                try:
                    resp = supabase_admin.storage.from_(settings.SUPABASE_STORAGE_BUCKET_AUDIO).download(segment.object_key)
                    audio_bytes = resp
                    # Minimal header: client should reuse same header format
                    header = json.dumps({
                        "seq": segment.seq,
                        "start_ms": segment.start_ms,
                        "end_ms": segment.end_ms,
                        "format": segment.format,
                        "bytes_len": segment.bytes_len,
                    }, separators=(",", ":")).encode("utf-8")
                    length_prefix = len(header).to_bytes(4, byteorder="big")
                    await websocket.send_bytes(length_prefix + header + audio_bytes)
                    ws_logger.info(f"Replayed segment {segment.seq} for guide {guide_id}")
                    sent_any = True
                except Exception as e:
                    ws_logger.error(f"Failed to replay segment {segment.seq}: {e}")
        if not sent_any:
            err = {"type": "error", "code": "NO_SEGMENTS", "message": "No segments to replay from position"}
            ws_logger.error(f"send -> {err}")
            await websocket.send_json(err)
    except Exception as e:
        logging.getLogger("ws.guide.replay").exception(f"Error handling replay: {e}")
        raise

async def handle_nack(websocket: WebSocket, nack_message: guide_schemas.NackMessage):
    """
    Handle negative acknowledgment for missing audio segments
    
    Args:
        websocket: WebSocket connection
        nack_message: NACK message
    """
    try:
        # Without guideId context, we cannot reliably fetch the segment.
        # Expect the client to reconnect with replay for now.
        ws_logger = logging.getLogger("ws.guide.nack")
        ws_logger.warning(f"NACK received for seq {nack_message.seq} - advise client to use replay")
        err = {
            "type": "error",
            "code": "NACK_USE_REPLAY",
            "message": f"Use replay to recover missing segment {nack_message.seq}"
        }
        ws_logger.error(f"send -> {err}")
        await websocket.send_json(err)
    except Exception as e:
        logging.getLogger("ws.guide.nack").exception(f"Error handling NACK: {e}")
        raise

@router.get("/guides/{device_id}")
async def get_device_guides(
    device_id: str,
    limit: int = 20,
    mapper: GuideMapper = Depends(get_guide_mapper)
):
    """
    Get guides for a specific device
    
    Args:
        device_id: Device identifier
        limit: Maximum number of guides to return
        
    Returns:
        List of guides for the device
    """
    try:
        guides = await mapper.get_guides_by_device(device_id, limit)
        
        # Convert to response format
        guide_responses = []
        for guide in guides:
            guide_responses.append({
                "guideId": guide.guide_id,
                "spot": guide.spot,
                "title": guide.title,
                "confidence": guide.confidence,
                "durationMs": guide.duration_ms,
                "createdAt": guide.created_at.isoformat() if guide.created_at else None
            })
        
        return {"guides": guide_responses}
        
    except Exception as e:
        print(f"Error getting device guides: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve guides"
        )

@router.get("/guides/{guide_id}/segments")
async def get_guide_segments(
    guide_id: str,
    mapper: GuideMapper = Depends(get_guide_mapper)
):
    """
    Get audio segments for a specific guide
    
    Args:
        guide_id: Guide identifier
        
    Returns:
        List of audio segments for the guide
    """
    try:
        segments = await mapper.get_guide_segments(guide_id)
        
        # Convert to response format
        segment_responses = []
        for segment in segments:
            segment_responses.append({
                "seq": segment.seq,
                "startMs": segment.start_ms,
                "endMs": segment.end_ms,
                "format": segment.format,
                "bitrateKbps": segment.bitrate_kbps,
                "bytesLen": segment.bytes_len,
                "objectKey": segment.object_key
            })
        
        return {"segments": segment_responses}
        
    except Exception as e:
        print(f"Error getting guide segments: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve guide segments"
        )

@router.get("/health")
async def health_check():
    """Health check endpoint for the guide service"""
    return {"status": "healthy", "service": "guide"}
