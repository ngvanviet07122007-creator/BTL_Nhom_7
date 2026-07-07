const BASE_URL_1 = "https://69fae8ff88a7af0ecca7ee05.mockapi.io/api/v1";
const BASE_URL_2 = "https://69faea5288a7af0ecca7f764.mockapi.io/api/v1";

const ApiService = {
    // LUỒNG QUẢN TRỊ (ADMIN): Sử dụng FETCH API (Promise .then) không dùng lai tạp 
    getPosts: () => fetch(`${BASE_URL_1}/posts`).then(res => res.json()),
    createPost: (data) => fetch(`${BASE_URL_1}/posts`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
    }).then(res => res.json()),
    updatePost: (id, data) => fetch(`${BASE_URL_1}/posts/${id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
    }).then(res => res.json()),
    deletePost: (id) => fetch(`${BASE_URL_1}/posts/${id}`, { method: 'DELETE' }).then(res => res.json()),
    deleteComment: (id) => fetch(`${BASE_URL_2}/comments/${id}`, { method: 'DELETE' }).then(res => res.json()),

    // LUỒNG CÔNG KHAI (PUBLIC): Sử dụng jQuery AJAX ($.get, $.ajax) lấy điểm phối hợp 
    getTags: () => $.get(`${BASE_URL_1}/tags`),
    getComments: () => $.get(`${BASE_URL_2}/comments`),
    createComment: (data) => $.ajax({
        url: `${BASE_URL_2}/comments`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data)
    })
};