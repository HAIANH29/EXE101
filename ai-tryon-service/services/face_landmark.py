import mediapipe as mp
import numpy as np

mp_face_mesh = mp.solutions.face_mesh

# Chỉ số landmark (trong 468 điểm của MediaPipe Face Mesh) dùng để canh vị trí tóc
FOREHEAD_TOP = 10       # điểm đỉnh trán — mốc đặt ảnh tóc
LEFT_FACE_EDGE = 234    # rìa mặt trái
RIGHT_FACE_EDGE = 454   # rìa mặt phải


class FaceLandmarkDetector:
    """
    Dùng MediaPipe Face Mesh để lấy landmark khuôn mặt, từ đó tính vị trí + kích
    thước cần đặt ảnh tóc PNG (đã tách nền, có alpha) lên ảnh khách hàng — theo
    kiểu overlay/dán sticker, KHÔNG tách pixel vùng tóc như segmentation.
    """

    def __init__(self):
        self._model = mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
        )

    def get_anchor(self, image_rgb: np.ndarray) -> dict:
        h, w, _ = image_rgb.shape
        results = self._model.process(image_rgb)

        if not results.multi_face_landmarks:
            raise ValueError("Không phát hiện được khuôn mặt trong ảnh")

        landmarks = results.multi_face_landmarks[0].landmark

        forehead = landmarks[FOREHEAD_TOP]
        left = landmarks[LEFT_FACE_EDGE]
        right = landmarks[RIGHT_FACE_EDGE]

        forehead_x = int(forehead.x * w)
        forehead_y = int(forehead.y * h)
        face_width_px = abs(right.x - left.x) * w

        return {
            "forehead_x": forehead_x,
            "forehead_y": forehead_y,
            "face_width_px": face_width_px,
        }
