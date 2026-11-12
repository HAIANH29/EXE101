import { Platform } from 'react-native';

/**
 * Web (chuột): cho phép nhấn giữ và kéo ngang để cuộn mọi danh sách cuộn ngang (mẫu tóc, bộ lọc,
 * chip, camera AI...). react-native-web chỉ cuộn ngang được bằng touch / trackpad / Shift+lăn chuột,
 * còn thanh cuộn thì bị ẩn, nên người dùng chuột không có cách nào xem thêm.
 *
 * Cài một lần ở cấp document nên áp dụng cho cả danh sách thêm sau này. Chỉ phản ứng với chuột
 * (touch/mobile giữ nguyên cách cuộn gốc). Kéo xa hơn vài px thì không tính là nhấn vào mục bên dưới.
 */

const DRAG_THRESHOLD = 5;

type Doc = Document;

function findHorizontalScroller(start: EventTarget | null): HTMLElement | null {
  let el = start instanceof HTMLElement ? start : null;
  while (el && el !== document.body) {
    if (el.scrollWidth > el.clientWidth + 1) {
      const overflowX = getComputedStyle(el).overflowX;
      if (overflowX === 'auto' || overflowX === 'scroll') return el;
    }
    el = el.parentElement;
  }
  return null;
}

function isFormControl(target: EventTarget | null) {
  return target instanceof HTMLElement
    && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

export function installDragScroll(doc: Doc = document): () => void {
  let scroller: HTMLElement | null = null;
  let startX = 0;
  let startScrollLeft = 0;
  let dragging = false;
  let suppressClick = false;

  const onMouseDown = (event: MouseEvent) => {
    if (event.button !== 0 || isFormControl(event.target)) return;
    scroller = findHorizontalScroller(event.target);
    if (!scroller) return;
    startX = event.clientX;
    startScrollLeft = scroller.scrollLeft;
    dragging = false;
    suppressClick = false;
  };

  const onMouseMove = (event: MouseEvent) => {
    if (!scroller) return;
    if ((event.buttons & 1) === 0) {
      scroller = null;
      return;
    }
    const dx = event.clientX - startX;
    if (!dragging && Math.abs(dx) > DRAG_THRESHOLD) {
      dragging = true;
      doc.body.style.userSelect = 'none';
      doc.body.style.cursor = 'grabbing';
    }
    if (dragging) {
      scroller.scrollLeft = startScrollLeft - dx;
      event.preventDefault();
    }
  };

  const endDrag = () => {
    if (dragging) {
      suppressClick = true; // click ngay sau khi thả chuột không được kích hoạt mục bên dưới
      setTimeout(() => {
        suppressClick = false;
      }, 0);
      doc.body.style.userSelect = '';
      doc.body.style.cursor = '';
    }
    dragging = false;
    scroller = null;
  };

  const onClickCapture = (event: MouseEvent) => {
    if (suppressClick) {
      event.stopPropagation();
      event.preventDefault();
    }
  };

  // Chặn kéo-thả ảnh mặc định của trình duyệt (làm hỏng thao tác kéo danh sách ảnh mẫu tóc)
  const onDragStart = (event: DragEvent) => {
    if (findHorizontalScroller(event.target)) event.preventDefault();
  };

  doc.addEventListener('mousedown', onMouseDown);
  doc.addEventListener('mousemove', onMouseMove, { passive: false });
  doc.addEventListener('mouseup', endDrag);
  doc.addEventListener('click', onClickCapture, true);
  doc.addEventListener('dragstart', onDragStart);

  return () => {
    doc.removeEventListener('mousedown', onMouseDown);
    doc.removeEventListener('mousemove', onMouseMove);
    doc.removeEventListener('mouseup', endDrag);
    doc.removeEventListener('click', onClickCapture, true);
    doc.removeEventListener('dragstart', onDragStart);
  };
}

/** Gọi một lần khi app khởi động; không làm gì trên Android/iOS. */
export function installDragScrollOnWeb(): () => void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return () => undefined;
  return installDragScroll(document);
}
