from typing import Dict, Any, List

COLD_VOLUMES = [
    {
        "id": "vol_01",
        "name": "Nori Memory Core",
        "size": "512 MB",
        "sealed": False,
        "files": ["personality_matrix.bin", "live2d_motion_cache.dat"]
    },
    {
        "id": "vol_02",
        "name": "Deep Datasea Archive",
        "size": "2.4 GB",
        "sealed": True,
        "files": ["ocean_echo_sub.dat", "corrupted_signal.log"]
    }
]

def list_device_volumes() -> List[Dict[str, Any]]:
    return COLD_VOLUMES

def unseal_volume(volume_id: str, key: str) -> Dict[str, Any]:
    for v in COLD_VOLUMES:
        if v["id"] == volume_id:
            v["sealed"] = False
            return {"success": True, "volume": v}
    return {"success": False, "error": "Volume not found"}
