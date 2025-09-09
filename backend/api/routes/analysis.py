"""
Analysis API Routes
Handles acoustic analysis and reporting endpoints
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
import asyncio
import logging
from pydantic import BaseModel
import json
import numpy as np
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)
router = APIRouter()

class AnalysisReport(BaseModel):
    report_id: str
    user_id: str
    analysis_data: Dict[str, Any]
    recommendations: List[Dict[str, Any]]
    generated_at: str
    report_type: str

class AnalysisRequest(BaseModel):
    user_id: str
    analysis_type: str
    parameters: Dict[str, Any]

# In-memory storage for demo (would use database in production)
analysis_storage = {}

@router.post("/run", response_model=AnalysisReport)
async def run_analysis(request: AnalysisRequest):
    """Run acoustic analysis with specified parameters"""
    try:
        # Generate report ID
        report_id = f"analysis_{request.user_id}_{int(datetime.now().timestamp())}"
        
        # Run analysis based on type
        if request.analysis_type == "full_acoustic":
            analysis_data = await _run_full_acoustic_analysis(request.parameters)
        elif request.analysis_type == "frequency_response":
            analysis_data = await _run_frequency_response_analysis(request.parameters)
        elif request.analysis_type == "stereo_imaging":
            analysis_data = await _run_stereo_imaging_analysis(request.parameters)
        elif request.analysis_type == "distortion_analysis":
            analysis_data = await _run_distortion_analysis(request.parameters)
        else:
            raise HTTPException(status_code=400, detail="Invalid analysis type")
        
        # Generate recommendations
        recommendations = await _generate_analysis_recommendations(analysis_data)
        
        # Create report
        report = AnalysisReport(
            report_id=report_id,
            user_id=request.user_id,
            analysis_data=analysis_data,
            recommendations=recommendations,
            generated_at=datetime.now().isoformat(),
            report_type=request.analysis_type
        )
        
        # Store report
        analysis_storage[report_id] = report.dict()
        
        return report
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error running analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/{user_id}")
async def get_user_reports(
    user_id: str,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    report_type: Optional[str] = None
):
    """Get analysis reports for a user"""
    try:
        # Filter reports by user and type
        user_reports = []
        for report_data in analysis_storage.values():
            if report_data["user_id"] == user_id:
                if report_type is None or report_data["report_type"] == report_type:
                    user_reports.append(report_data)
        
        # Sort by generation time (newest first)
        user_reports.sort(key=lambda x: x["generated_at"], reverse=True)
        
        # Apply pagination
        total_count = len(user_reports)
        paginated_reports = user_reports[offset:offset + limit]
        
        return {
            "reports": paginated_reports,
            "total_count": total_count,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total_count
        }
        
    except Exception as e:
        logger.error(f"Error getting user reports: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/{user_id}/{report_id}")
async def get_report(user_id: str, report_id: str):
    """Get specific analysis report"""
    try:
        if report_id not in analysis_storage:
            raise HTTPException(status_code=404, detail="Report not found")
        
        report_data = analysis_storage[report_id]
        
        if report_data["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return report_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/reports/{user_id}/{report_id}")
async def delete_report(user_id: str, report_id: str):
    """Delete analysis report"""
    try:
        if report_id not in analysis_storage:
            raise HTTPException(status_code=404, detail="Report not found")
        
        report_data = analysis_storage[report_id]
        
        if report_data["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        del analysis_storage[report_id]
        
        return {"message": "Report deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/statistics/{user_id}")
async def get_analysis_statistics(user_id: str):
    """Get analysis statistics for a user"""
    try:
        # Get all reports for user
        user_reports = [report for report in analysis_storage.values() if report["user_id"] == user_id]
        
        if not user_reports:
            return {
                "user_id": user_id,
                "total_reports": 0,
                "reports_by_type": {},
                "average_analysis_time": 0,
                "last_analysis": None
            }
        
        # Calculate statistics
        total_reports = len(user_reports)
        
        # Reports by type
        reports_by_type = {}
        for report in user_reports:
            report_type = report["report_type"]
            reports_by_type[report_type] = reports_by_type.get(report_type, 0) + 1
        
        # Average analysis time (simulated)
        average_analysis_time = 2.5  # seconds
        
        # Last analysis
        last_analysis = max(user_reports, key=lambda x: x["generated_at"])["generated_at"]
        
        return {
            "user_id": user_id,
            "total_reports": total_reports,
            "reports_by_type": reports_by_type,
            "average_analysis_time": average_analysis_time,
            "last_analysis": last_analysis
        }
        
    except Exception as e:
        logger.error(f"Error getting analysis statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/compare")
async def compare_analyses(
    report_ids: List[str],
    comparison_type: str = "side_by_side"
):
    """Compare multiple analysis reports"""
    try:
        if len(report_ids) < 2:
            raise HTTPException(status_code=400, detail="At least 2 reports required for comparison")
        
        # Get reports
        reports = []
        for report_id in report_ids:
            if report_id not in analysis_storage:
                raise HTTPException(status_code=404, detail=f"Report {report_id} not found")
            reports.append(analysis_storage[report_id])
        
        # Perform comparison
        if comparison_type == "side_by_side":
            comparison_result = await _side_by_side_comparison(reports)
        elif comparison_type == "trend_analysis":
            comparison_result = await _trend_analysis_comparison(reports)
        else:
            raise HTTPException(status_code=400, detail="Invalid comparison type")
        
        return {
            "comparison_type": comparison_type,
            "report_ids": report_ids,
            "comparison_result": comparison_result,
            "generated_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error comparing analyses: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper functions for analysis types

async def _run_full_acoustic_analysis(parameters: Dict[str, Any]) -> Dict[str, Any]:
    """Run comprehensive acoustic analysis"""
    # Simulate analysis processing
    await asyncio.sleep(0.1)
    
    return {
        "frequency_response": {
            "frequencies": [20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500],
            "magnitude": np.random.uniform(-10, 10, 15).tolist(),
            "phase": np.random.uniform(-180, 180, 15).tolist()
        },
        "resonance_analysis": {
            "resonance_frequencies": [80, 120, 200, 400],
            "resonance_strength": [0.8, 0.6, 0.4, 0.3],
            "q_factors": [5.2, 3.8, 2.1, 1.9]
        },
        "reverb_analysis": {
            "rt60": 0.45,
            "early_decay_time": 0.38,
            "clarity_index": 2.1
        },
        "stereo_analysis": {
            "stereo_width": 0.75,
            "center_image_strength": 0.85,
            "phase_coherence": 0.92
        },
        "distortion_analysis": {
            "thd": 0.8,
            "imd": 0.3,
            "noise_floor": -65.2
        }
    }

async def _run_frequency_response_analysis(parameters: Dict[str, Any]) -> Dict[str, Any]:
    """Run frequency response analysis"""
    await asyncio.sleep(0.1)
    
    return {
        "frequency_response": {
            "frequencies": [20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500],
            "magnitude": np.random.uniform(-10, 10, 15).tolist(),
            "phase": np.random.uniform(-180, 180, 15).tolist()
        },
        "smoothness": 0.85,
        "flatness": 0.72,
        "extended_response": True
    }

async def _run_stereo_imaging_analysis(parameters: Dict[str, Any]) -> Dict[str, Any]:
    """Run stereo imaging analysis"""
    await asyncio.sleep(0.1)
    
    return {
        "stereo_width": 0.75,
        "center_image_strength": 0.85,
        "left_right_balance": 0.52,
        "phase_coherence": 0.92,
        "spatial_coherence": 0.88,
        "imaging_quality": "excellent"
    }

async def _run_distortion_analysis(parameters: Dict[str, Any]) -> Dict[str, Any]:
    """Run distortion analysis"""
    await asyncio.sleep(0.1)
    
    return {
        "thd": 0.8,
        "imd": 0.3,
        "noise_floor": -65.2,
        "dynamic_range": 85.4,
        "distortion_rating": "good"
    }

async def _generate_analysis_recommendations(analysis_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate recommendations based on analysis data"""
    recommendations = []
    
    # Frequency response recommendations
    if "frequency_response" in analysis_data:
        freq_data = analysis_data["frequency_response"]
        if "magnitude" in freq_data:
            magnitude = freq_data["magnitude"]
            if max(magnitude) - min(magnitude) > 15:
                recommendations.append({
                    "type": "frequency_response",
                    "priority": "high",
                    "message": "Large frequency response variations detected. Consider EQ adjustment.",
                    "action": "eq_optimization"
                })
    
    # Resonance recommendations
    if "resonance_analysis" in analysis_data:
        resonance_data = analysis_data["resonance_analysis"]
        if "resonance_strength" in resonance_data:
            max_resonance = max(resonance_data["resonance_strength"])
            if max_resonance > 0.7:
                recommendations.append({
                    "type": "resonance",
                    "priority": "high",
                    "message": "Strong resonances detected. Consider acoustic treatment.",
                    "action": "acoustic_treatment"
                })
    
    # Reverb recommendations
    if "reverb_analysis" in analysis_data:
        reverb_data = analysis_data["reverb_analysis"]
        if "rt60" in reverb_data:
            rt60 = reverb_data["rt60"]
            if rt60 > 0.6:
                recommendations.append({
                    "type": "reverb",
                    "priority": "medium",
                    "message": "High reverb time detected. Consider acoustic damping.",
                    "action": "add_damping"
                })
    
    # Stereo recommendations
    if "stereo_analysis" in analysis_data:
        stereo_data = analysis_data["stereo_analysis"]
        if "stereo_width" in stereo_data:
            width = stereo_data["stereo_width"]
            if width < 0.4:
                recommendations.append({
                    "type": "stereo_imaging",
                    "priority": "medium",
                    "message": "Narrow stereo image. Check speaker positioning.",
                    "action": "adjust_speaker_position"
                })
    
    return recommendations

async def _side_by_side_comparison(reports: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Perform side-by-side comparison of reports"""
    comparison = {
        "report_count": len(reports),
        "comparison_metrics": {},
        "differences": [],
        "improvements": [],
        "regressions": []
    }
    
    # Compare common metrics
    if len(reports) >= 2:
        report1 = reports[0]
        report2 = reports[1]
        
        # Compare frequency response
        if "frequency_response" in report1["analysis_data"] and "frequency_response" in report2["analysis_data"]:
            freq1 = report1["analysis_data"]["frequency_response"]["magnitude"]
            freq2 = report2["analysis_data"]["frequency_response"]["magnitude"]
            
            if len(freq1) == len(freq2):
                differences = [abs(f1 - f2) for f1, f2 in zip(freq1, freq2)]
                comparison["comparison_metrics"]["frequency_response_difference"] = {
                    "average_difference": sum(differences) / len(differences),
                    "max_difference": max(differences)
                }
    
    return comparison

async def _trend_analysis_comparison(reports: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Perform trend analysis comparison of reports"""
    # Sort reports by generation time
    sorted_reports = sorted(reports, key=lambda x: x["generated_at"])
    
    trend_analysis = {
        "report_count": len(reports),
        "time_span": {
            "start": sorted_reports[0]["generated_at"],
            "end": sorted_reports[-1]["generated_at"]
        },
        "trends": [],
        "overall_improvement": "stable"
    }
    
    # Analyze trends over time
    if len(sorted_reports) >= 3:
        # Simple trend analysis
        trend_analysis["trends"].append({
            "metric": "analysis_quality",
            "trend": "improving",
            "confidence": 0.75
        })
    
    return trend_analysis
