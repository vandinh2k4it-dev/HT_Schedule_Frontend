// Bảng màu DÙNG CHUNG cho toàn bộ app — tông xanh-đen hiện đại, dễ phân biệt,
// không còn xanh/vàng/đỏ lẫn lộn như trước. Mỗi mã ca có 1 màu cố định,
// nhất quán ở mọi nơi hiển thị (lịch tham khảo, lịch làm, đăng ký...).

// Ca làm việc: mỗi mã 1 sắc xanh/tím khác nhau, dễ phân biệt bằng mắt
export const SHIFT_COLOR = {
    A: 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/40',
    B: 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/40',
    F: 'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/40',
    DEFAULT: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/40',
}

// Trạng thái OFF (không có ca) — trung tính, không dùng đỏ nữa
export const OFF_COLOR =
    'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800/50 dark:text-slate-500 dark:border-slate-700'

// Solid version (dùng cho badge nổi bật, nút chọn...)
export const SHIFT_SOLID = {
    A: 'bg-sky-500 text-white',
    B: 'bg-indigo-500 text-white',
    F: 'bg-teal-500 text-white',
    DEFAULT: 'bg-slate-500 text-white',
}

// Đang chờ duyệt — viền cam nhạt, chỉ dùng khi thật sự có yêu cầu chờ
export const PENDING_RING = 'ring-2 ring-offset-1 ring-amber-400 dark:ring-amber-500 dark:ring-offset-slate-900'
export const REJECTED_STYLE = 'opacity-40 line-through'

export const shiftClass = code => SHIFT_COLOR[code] || SHIFT_COLOR.DEFAULT
export const shiftSolid = code => SHIFT_SOLID[code] || SHIFT_SOLID.DEFAULT
