# src/mappers/guide_mapper.py
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any, TYPE_CHECKING
from postgrest import APIResponse
from ..models.guide_models import IdentifySession, Guide, GuideSegment
from ..schemas.guide import AudioSegmentInfo

if TYPE_CHECKING:
    from supabase import Client

class GuideMapper:
    """Data mapper for guide-related database operations"""
    
    def __init__(self, db: "Client"):
        self.db = db
    
    async def create_identify_session(
        self,
        identify_id: str,
        device_id: str,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        accuracy_m: Optional[int] = None,
        spot: Optional[str] = None,
        confidence: Optional[float] = None,
        bbox: Optional[Dict[str, Any]] = None
    ) -> Optional[IdentifySession]:
        """
        Create a new identify session record
        
        Args:
            identify_id: Unique identifier for the session
            device_id: Device identifier
            lat: Latitude
            lng: Longitude
            accuracy_m: GPS accuracy in meters
            spot: Identified location name
            confidence: Confidence score
            bbox: Bounding box coordinates
            
        Returns:
            Created IdentifySession or None if failed
        """
        try:
            session_data = {
                "identify_id": identify_id,
                "device_id": device_id,
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Add optional fields if provided
            if lat is not None:
                session_data["lat"] = lat
            if lng is not None:
                session_data["lng"] = lng
            if accuracy_m is not None:
                session_data["accuracy_m"] = accuracy_m
            if spot is not None:
                session_data["spot"] = spot
            if confidence is not None:
                session_data["confidence"] = confidence
            if bbox is not None:
                session_data["bbox"] = bbox
            
            response: APIResponse = (
                self.db.table("identify_sessions")
                .insert(session_data)
                .execute()
            )
            
            if response.data:
                return IdentifySession(**response.data[0])
            return None
            
        except Exception as e:
            print(f"Error creating identify session: {e}")
            return None
    
    async def get_identify_session(self, identify_id: str) -> Optional[IdentifySession]:
        """
        Get identify session by ID
        
        Args:
            identify_id: Session identifier
            
        Returns:
            IdentifySession or None if not found
        """
        try:
            response: APIResponse = (
                self.db.table("identify_sessions")
                .select("*")
                .eq("identify_id", identify_id)
                .execute()
            )
            
            if response.data:
                return IdentifySession(**response.data[0])
            return None
            
        except Exception as e:
            print(f"Error getting identify session: {e}")
            return None
    
    async def create_guide(
        self,
        guide_id: str,
        device_id: Optional[str] = None,
        spot: Optional[str] = None,
        title: Optional[str] = None,
        confidence: Optional[float] = None,
        transcript: Optional[str] = None,
        duration_ms: Optional[int] = None
    ) -> Optional[Guide]:
        """
        Create a new guide record
        
        Args:
            guide_id: Unique identifier for the guide
            device_id: Device identifier
            spot: Location name
            title: Guide title
            confidence: Confidence score
            transcript: Complete transcript
            duration_ms: Total duration in milliseconds
            
        Returns:
            Created Guide or None if failed
        """
        try:
            guide_data = {
                "guide_id": guide_id,
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Add optional fields if provided
            if device_id is not None:
                guide_data["device_id"] = device_id
            if spot is not None:
                guide_data["spot"] = spot
            if title is not None:
                guide_data["title"] = title
            if confidence is not None:
                guide_data["confidence"] = confidence
            if transcript is not None:
                guide_data["transcript"] = transcript
            if duration_ms is not None:
                guide_data["duration_ms"] = duration_ms
            
            response: APIResponse = (
                self.db.table("guides")
                .insert(guide_data)
                .execute()
            )
            
            if response.data:
                return Guide(**response.data[0])
            return None
            
        except Exception as e:
            print(f"Error creating guide: {e}")
            return None
    
    async def update_guide(
        self,
        guide_id: str,
        transcript: Optional[str] = None,
        duration_ms: Optional[int] = None,
        **kwargs
    ) -> bool:
        """
        Update guide record
        
        Args:
            guide_id: Guide identifier
            transcript: Updated transcript
            duration_ms: Updated duration
            **kwargs: Other fields to update
            
        Returns:
            True if successful, False otherwise
        """
        try:
            update_data = {}
            
            if transcript is not None:
                update_data["transcript"] = transcript
            if duration_ms is not None:
                update_data["duration_ms"] = duration_ms
            
            # Add any additional fields
            update_data.update(kwargs)
            
            if not update_data:
                return True  # Nothing to update
            
            response: APIResponse = (
                self.db.table("guides")
                .update(update_data)
                .eq("guide_id", guide_id)
                .execute()
            )
            
            return True
            
        except Exception as e:
            print(f"Error updating guide: {e}")
            return False
    
    async def create_guide_segment(
        self,
        guide_id: str,
        seq: int,
        start_ms: Optional[int] = None,
        end_ms: Optional[int] = None,
        format: Optional[str] = None,
        bitrate_kbps: Optional[int] = None,
        bytes_len: Optional[int] = None,
        object_key: Optional[str] = None
    ) -> Optional[GuideSegment]:
        """
        Create a guide segment record
        
        Args:
            guide_id: Guide identifier
            seq: Sequence number
            start_ms: Start time in milliseconds
            end_ms: End time in milliseconds
            format: Audio format
            bitrate_kbps: Bitrate in kbps
            bytes_len: Size in bytes
            object_key: Storage object key
            
        Returns:
            Created GuideSegment or None if failed
        """
        try:
            segment_data = {
                "guide_id": guide_id,
                "seq": seq
            }
            
            # Add optional fields if provided
            if start_ms is not None:
                segment_data["start_ms"] = start_ms
            if end_ms is not None:
                segment_data["end_ms"] = end_ms
            if format is not None:
                segment_data["format"] = format
            if bitrate_kbps is not None:
                segment_data["bitrate_kbps"] = bitrate_kbps
            if bytes_len is not None:
                segment_data["bytes_len"] = bytes_len
            if object_key is not None:
                segment_data["object_key"] = object_key
            
            response: APIResponse = (
                self.db.table("guide_segments")
                .insert(segment_data)
                .execute()
            )
            
            if response.data:
                return GuideSegment(**response.data[0])
            return None
            
        except Exception as e:
            print(f"Error creating guide segment: {e}")
            return None
    
    async def create_guide_segments_batch(
        self,
        segments: List[AudioSegmentInfo],
        guide_id: str
    ) -> bool:
        """
        Create multiple guide segments in a batch
        
        Args:
            segments: List of segment information
            guide_id: Guide identifier
            
        Returns:
            True if successful, False otherwise
        """
        try:
            segments_data = []
            for segment in segments:
                segment_data = {
                    "guide_id": guide_id,
                    "seq": segment.seq,
                    "start_ms": segment.start_ms,
                    "end_ms": segment.end_ms,
                    "format": segment.format,
                    "bitrate_kbps": segment.bitrate_kbps,
                    "bytes_len": segment.bytes_len,
                    "object_key": segment.object_key
                }
                segments_data.append(segment_data)
            
            response: APIResponse = (
                self.db.table("guide_segments")
                .insert(segments_data)
                .execute()
            )
            
            return True
            
        except Exception as e:
            print(f"Error creating guide segments batch: {e}")
            return False
    
    async def get_guide_segments(self, guide_id: str) -> List[GuideSegment]:
        """
        Get all segments for a guide
        
        Args:
            guide_id: Guide identifier
            
        Returns:
            List of GuideSegment objects
        """
        try:
            response: APIResponse = (
                self.db.table("guide_segments")
                .select("*")
                .eq("guide_id", guide_id)
                .order("seq")
                .execute()
            )
            
            if response.data:
                return [GuideSegment(**segment_data) for segment_data in response.data]
            return []
            
        except Exception as e:
            print(f"Error getting guide segments: {e}")
            return []
    
    async def get_guide(self, guide_id: str) -> Optional[Guide]:
        """
        Get guide by ID
        
        Args:
            guide_id: Guide identifier
            
        Returns:
            Guide or None if not found
        """
        try:
            response: APIResponse = (
                self.db.table("guides")
                .select("*")
                .eq("guide_id", guide_id)
                .execute()
            )
            
            if response.data:
                return Guide(**response.data[0])
            return None
            
        except Exception as e:
            print(f"Error getting guide: {e}")
            return None
    
    async def create_guide_and_segments(
        self,
        guide_data: Dict[str, Any],
        segments_data: List[Dict[str, Any]]
    ) -> bool:
        """
        Create guide and segments in a transaction-like operation
        
        Args:
            guide_data: Guide data dictionary
            segments_data: List of segment data dictionaries
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # First create the guide
            guide_response: APIResponse = (
                self.db.table("guides")
                .insert(guide_data)
                .execute()
            )
            
            if not guide_response.data:
                return False
            
            # Then create segments if any
            if segments_data:
                segments_response: APIResponse = (
                    self.db.table("guide_segments")
                    .insert(segments_data)
                    .execute()
                )
                
                if not segments_response.data:
                    # Note: In a real transaction, we would rollback the guide creation
                    print("Warning: Guide created but segments failed")
            
            return True
            
        except Exception as e:
            print(f"Error creating guide and segments: {e}")
            return False
    
    async def get_guides_by_device(self, device_id: str, limit: int = 50) -> List[Guide]:
        """
        Get guides for a specific device
        
        Args:
            device_id: Device identifier
            limit: Maximum number of guides to return
            
        Returns:
            List of Guide objects
        """
        try:
            response: APIResponse = (
                self.db.table("guides")
                .select("*")
                .eq("device_id", device_id)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            
            if response.data:
                return [Guide(**guide_data) for guide_data in response.data]
            return []
            
        except Exception as e:
            print(f"Error getting guides by device: {e}")
            return []
