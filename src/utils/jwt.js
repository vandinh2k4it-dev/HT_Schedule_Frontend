// Decode phần payload của JWT đúng chuẩn UTF-8.
// atob() trả về "binary string" (mỗi ký tự = 1 byte kiểu Latin-1), nên nếu
// JSON.parse(atob(...)) trực tiếp thì mọi ký tự tiếng Việt (chiếm nhiều byte
// trong UTF-8) sẽ bị đọc sai, ra chữ kiểu "VÃ¡n ÄÃ¡»Ã­nh" thay vì "Văn Định".
// Hàm dưới đây decode đúng bằng cách chuyển từng byte thành %XX rồi
// decodeURIComponent (đây là cách chuẩn được khuyến nghị cho JWT trên trình duyệt).
export function parseJwt(token) {
    if (!token) return {}
    try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        )
        return JSON.parse(jsonPayload)
    } catch (err) {
        console.error('parseJwt failed:', err)
        return {}
    }
}