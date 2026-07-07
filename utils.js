function formatDate(dateString) {
    if (!dateString) return 'Chưa rõ thời gian';
    const date = new Date(dateString);
    // Sử dụng toLocaleString để hiển thị cả ngày, tháng, năm, giờ, phút
    return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

function isValidImageUrl(url) {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://');
}