from flask import Blueprint, jsonify, request

from services.detection_service import DetectionService
from services.stream_service import StreamService


plate_bp = Blueprint("plate", __name__)
detection_service = DetectionService()
stream_service = StreamService()


def parse_confidence(data):
    try:
        return float(data.get("confidence"))
    except (TypeError, ValueError):
        return None


@plate_bp.route("/plate/latest", methods=["GET"])
def latest_plate():
    return jsonify({"success": True, "data": detection_service.get_latest()})


@plate_bp.route("/plate/history", methods=["GET"])
def plate_history():
    return jsonify({"success": True, "data": detection_service.get_history()})


@plate_bp.route("/plate/detect", methods=["POST"])
def add_detection():
    data = request.get_json(silent=True) or {}
    plate = data.get("plate")
    confidence = parse_confidence(data)
    if not plate:
        return jsonify({"success": False, "message": "Plat nomor wajib diisi"}), 400
    if confidence is None:
        return jsonify({"success": False, "message": "Confidence harus berupa angka"}), 400

    result = detection_service.add_detection(
        plate=plate,
        confidence=confidence,
        camera=data.get("camera", "Tidak diketahui"),
        bbox=data.get("bbox")
    )
    return jsonify({
        "success": True,
        "message": "Data deteksi berhasil ditambahkan",
        "data": result
    })


@plate_bp.route("/plate/history", methods=["DELETE"])
def clear_history():
    detection_service.clear_history()
    return jsonify({"success": True, "message": "History berhasil dihapus"})


@plate_bp.route("/face/latest", methods=["GET"])
def latest_face():
    return jsonify({"success": True, "data": detection_service.get_latest_face()})


@plate_bp.route("/face/history", methods=["GET"])
def face_history():
    return jsonify({"success": True, "data": detection_service.get_face_history()})


@plate_bp.route("/face/detect", methods=["POST"])
def add_face_detection():
    data = request.get_json(silent=True) or {}
    confidence = parse_confidence(data)
    try:
        face_count = int(data.get("face_count"))
    except (TypeError, ValueError):
        face_count = None

    if face_count is None or face_count < 0:
        return jsonify({
            "success": False,
            "message": "face_count harus berupa angka nol atau lebih"
        }), 400
    if confidence is None:
        return jsonify({"success": False, "message": "Confidence harus berupa angka"}), 400

    result = detection_service.add_face_detection(
        face_count=face_count,
        confidence=confidence,
        camera=data.get("camera", "Tidak diketahui"),
        bbox=data.get("bbox")
    )
    return jsonify({
        "success": True,
        "message": "Data deteksi wajah berhasil ditambahkan",
        "data": result
    })


@plate_bp.route("/face/history", methods=["DELETE"])
def clear_face_history():
    detection_service.clear_face_history()
    return jsonify({"success": True, "message": "History wajah berhasil dihapus"})


@plate_bp.route("/stream/status", methods=["GET"])
def stream_status():
    return jsonify({"success": True, "data": stream_service.status()})


@plate_bp.route("/cameras", methods=["GET"])
def list_cameras():
    return jsonify({"success": True, "data": stream_service.list_cameras()})


@plate_bp.route("/cameras", methods=["POST"])
def create_camera():
    camera = stream_service.add_camera(request.get_json(silent=True) or {})
    if not camera:
        return jsonify({"success": False, "message": "Nama dan URL kamera wajib diisi"}), 400
    return jsonify({"success": True, "data": camera}), 201


@plate_bp.route("/cameras/<int:camera_id>", methods=["PUT"])
def update_camera(camera_id):
    camera = stream_service.update_camera(camera_id, request.get_json(silent=True) or {})
    if not camera:
        return jsonify({"success": False, "message": "Kamera tidak ditemukan atau data tidak valid"}), 404
    return jsonify({"success": True, "data": camera})


@plate_bp.route("/cameras/<int:camera_id>", methods=["DELETE"])
def delete_camera(camera_id):
    if not stream_service.delete_camera(camera_id):
        return jsonify({"success": False, "message": "Kamera tidak ditemukan"}), 404
    return jsonify({"success": True, "message": "Kamera berhasil dihapus"})


@plate_bp.route("/stream/start", methods=["POST"])
def start_stream():
    data = request.get_json(silent=True) or {}
    result = stream_service.start(data.get("stream_url"))
    return jsonify(result), 200 if result["success"] else 400


@plate_bp.route("/stream/stop", methods=["POST"])
def stop_stream():
    return jsonify(stream_service.stop())
