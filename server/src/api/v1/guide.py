# src/api/v1/guide.py
import uuid
import json
from typing import Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.responses import JSONResponse

from ...schemas import guide as guide_schemas
from ...services.vision import vision_service
from ...services.orchestrator import NarrativeOrchestrator
from ...mappers.guide_mapper import GuideMapper
from ..deps import get_guide_mapper

router = APIRouter(prefix="/guide", tags=["guide"])

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
        # Generate unique identify session ID
        identify_id = f"id_{uuid.uuid4().hex[:12]}"
        
        # Call vision service to identify location
        candidates = await vision_service.identify_location(request)
        
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
        
        return guide_schemas.IdentifyResponse(
            identifyId=identify_id,
            candidates=candidates
        )
        
    except Exception as e:
        print(f"Error in identify endpoint: {e}")
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
    
    try:
        orchestrator = None
        
        while True:
            # Receive message from client
            try:
                message_data = await websocket.receive_json()
            except Exception as e:
                print(f"Error receiving WebSocket message: {e}")
                break
            
            message_type = message_data.get("type")
            
            if message_type == "init":
                try:
                    # Parse and validate init message
                    init_message = guide_schemas.InitMessage(**message_data)
                    
                    # Create orchestrator and start streaming
                    orchestrator = NarrativeOrchestrator(websocket, init_message)
                    await orchestrator.stream()
                    
                except Exception as e:
                    print(f"Error in init message handling: {e}")
                    await websocket.send_json({
                        "type": "error",
                        "code": "INIT_ERROR",
                        "message": f"Failed to initialize guide stream: {str(e)}"
                    })
                    
            elif message_type == "replay":
                try:
                    replay_message = guide_schemas.ReplayMessage(**message_data)
                    await handle_replay(websocket, replay_message)
                except Exception as e:
                    print(f"Error in replay message handling: {e}")
                    await websocket.send_json({
                        "type": "error",
                        "code": "REPLAY_ERROR",
                        "message": f"Failed to replay guide: {str(e)}"
                    })
                    
            elif message_type == "nack":
                try:
                    nack_message = guide_schemas.NackMessage(**message_data)
                    await handle_nack(websocket, nack_message)
                except Exception as e:
                    print(f"Error in nack message handling: {e}")
                    await websocket.send_json({
                        "type": "error",
                        "code": "NACK_ERROR",
                        "message": f"Failed to handle nack: {str(e)}"
                    })
                    
            elif message_type == "close":
                try:
                    close_message = guide_schemas.CloseMessage(**message_data)
                    print(f"Client requested close")
                    break
                except Exception as e:
                    print(f"Error in close message handling: {e}")
                    break
                    
            else:
                await websocket.send_json({
                    "type": "error",
                    "code": "UNKNOWN_MESSAGE_TYPE",
                    "message": f"Unknown message type: {message_type}"
                })
                
    except WebSocketDisconnect:
        print("WebSocket client disconnected")
    except Exception as e:
        print(f"Unexpected WebSocket error: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "code": "INTERNAL_ERROR",
                "message": "Internal server error"
            })
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
        # This is a placeholder implementation
        # In a real system, you would:
        # 1. Fetch the guide and its segments from database
        # 2. Start streaming from the specified position
        # 3. Send audio segments from storage
        
        guide_id = replay_message.guideId
        from_ms = replay_message.fromMs
        
        print(f"Replay requested for guide {guide_id} from {from_ms}ms")
        
        # For now, send an error indicating replay is not implemented
        await websocket.send_json({
            "type": "error",
            "code": "REPLAY_NOT_IMPLEMENTED",
            "message": "Replay functionality is not yet implemented"
        })
        
    except Exception as e:
        print(f"Error handling replay: {e}")
        raise

async def handle_nack(websocket: WebSocket, nack_message: guide_schemas.NackMessage):
    """
    Handle negative acknowledgment for missing audio segments
    
    Args:
        websocket: WebSocket connection
        nack_message: NACK message
    """
    try:
        seq = nack_message.seq
        
        print(f"NACK received for sequence {seq}")
        
        # This is a placeholder implementation
        # In a real system, you would:
        # 1. Look up the missing segment in database
        # 2. Retrieve it from storage
        # 3. Resend the segment
        
        # For now, send an error indicating NACK handling is not implemented
        await websocket.send_json({
            "type": "error",
            "code": "NACK_NOT_IMPLEMENTED",
            "message": f"NACK handling for sequence {seq} is not yet implemented"
        })
        
    except Exception as e:
        print(f"Error handling NACK: {e}")
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
