let localPosts = [];
let localTags = [];
let localComments = [];
let commentModalInstance = null;
let blogModalInstance = null;

document.addEventListener("DOMContentLoaded", function () {
    if (typeof bootstrap !== 'undefined') {
        commentModalInstance = new bootstrap.Modal(document.getElementById('commentManagerModal'));
        blogModalInstance = new bootstrap.Modal(document.getElementById('blogModal'));
    }
    
    initAdminDashboard();
    
    document.getElementById("btnSubmitForm").addEventListener("click", handleSavePost);
    document.getElementById("btnOpenAddModal").addEventListener("click", resetFormForAdd);
    document.getElementById("btnOpenCmtManager").addEventListener("click", openCommentManager);
});

function initAdminDashboard() {
    document.getElementById("adminSpinner").style.display = "block";
    document.getElementById("adminPostList").innerHTML = "";

    ApiService.getPosts()
        .then(posts => {
            localPosts = posts;
            return ApiService.getTags();
        })
        .then(tags => {
            localTags = tags;
            return ApiService.getComments();
        })
        .then(comments => {
            localComments = comments;
            document.getElementById("adminCommentBadge").innerText = comments.length;
            renderTagsCheckbox();
            renderAdminPostList();
        })
        .catch(() => {
            document.getElementById("adminPostList").innerHTML = `<div class="alert alert-danger text-center">Lỗi liên kết API dữ liệu!</div>`;
        })
        .finally(() => {
            document.getElementById("adminSpinner").style.display = "none";
        });
}

function renderTagsCheckbox() {
    let html = "";
    localTags.forEach(tag => {
        html += `
            <div class="form-check">
                <input class="form-check-input form-tag-cb" type="checkbox" value="${tag.id}" id="cb_tag_${tag.id}">
                <label class="form-check-label" for="cb_tag_${tag.id}">${tag.name}</label>
            </div>`;
    });
    document.getElementById("formTagsContainer").innerHTML = html;
}

function renderAdminPostList() {
    const postListContainer = document.getElementById("adminPostList");
    if (localPosts.length === 0) {
        postListContainer.innerHTML = `<div class="alert alert-info text-center">Hệ thống chưa có bài viết nào.</div>`;
        return;
    }

    let html = "";
    localPosts.forEach(post => {
        const matchedTags = localTags.filter(t => {
            return post.tagIds && Array.isArray(post.tagIds) && post.tagIds.some(tagId => String(tagId).trim() === String(t.id).trim());
        });
        const tagsString = matchedTags.map(t => t.name).join(", ") || "Chưa phân loại";
        const isPublishedStatus = post.isPublished !== false;

        html += `
            <div class="card shadow-sm border-0 bg-white px-3 py-2 rounded-3">
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div class="d-flex align-items-center gap-3">
                        <img src="${post.image}" class="admin-blog-thumbnail" alt="Thumb">
                        <div>
                            <h5 class="fw-bold mb-1 fs-6 text-dark">${post.title}</h5>
                            <span class="badge bg-light text-primary border border-primary-subtle fw-normal">${tagsString}</span>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-3">
                        <span class="badge ${isPublishedStatus ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning border border-warning-subtle'} rounded-1 px-2 py-1">
                            ${isPublishedStatus ? 'Đã xuất bản' : 'Bản nháp'}
                        </span>
                        <button class="btn text-primary p-1 fs-5" onclick="setupEditForm('${post.id}')"><i class="bi bi-pencil-square"></i></button>
                        <button class="btn text-danger p-1 fs-5" onclick="executeDeletePost('${post.id}')"><i class="bi bi-trash"></i></button>
                    </div>
                </div>
            </div>`;
    });
    postListContainer.innerHTML = html;
}

function openCommentManager() {
    renderCommentTable();
    if (commentModalInstance) commentModalInstance.show();
}

function renderCommentTable() {
    const tableBody = document.getElementById("adminCommentTableBody");
    if (localComments.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">Không có bình luận nào trên hệ thống.</td></tr>`;
        return;
    }

    let html = "";
    localComments.forEach(cmt => {
        html += `
            <tr id="admin-cmt-row-${cmt.id}">
                <td><strong class="text-dark small">${cmt.name}</strong></td>
                <td><span class="text-secondary small">${cmt.content}</span></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger border-0" onclick="executeDeleteComment('${cmt.id}')">
                        <i class="bi bi-trash3-fill"></i> Xóa
                    </button>
                </td>
            </tr>`;
    });
    tableBody.innerHTML = html;
}

function executeDeleteComment(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa phản hồi ý kiến này không?")) return;

    ApiService.deleteComment(id)
        .then(() => {
            alert("Xóa bình luận thành công!");
            localComments = localComments.filter(c => String(c.id) !== String(id));
            document.getElementById("adminCommentBadge").innerText = localComments.length;
            const targetRow = document.getElementById(`admin-cmt-row-${id}`);
            if (targetRow) targetRow.remove();
            if (localComments.length === 0) renderCommentTable();
        })
        .catch(() => alert("Không thể thực hiện xóa bình luận vào lúc này."));
}

function resetFormForAdd() {
    document.getElementById("blogModalLabel").innerText = "Soạn Thảo Bài Viết Mới";
    document.getElementById("formPostId").value = "";
    document.getElementById("adminBlogForm").reset();
    document.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
    document.getElementById("tagError").style.display = "none";
    if (blogModalInstance) blogModalInstance.show();
}

function setupEditForm(id) {
    resetFormForAdd();
    document.getElementById("blogModalLabel").innerText = `Chỉnh Sửa Bài Viết #${id}`;
    
    const post = localPosts.find(p => String(p.id) === String(id));
    if (!post) return;

    document.getElementById("formPostId").value = post.id;
    document.getElementById("formTitle").value = post.title;
    document.getElementById("formDescription").value = post.description || "";
    document.getElementById("formContent").value = post.content;
    document.getElementById("formImage").value = post.image;
    document.getElementById("formPublished").checked = post.isPublished !== false;

    if (post.tagIds && Array.isArray(post.tagIds)) {
        post.tagIds.forEach(tagId => {
            const cb = document.getElementById(`cb_tag_${tagId}`);
            if (cb) cb.checked = true;
        });
    }
}

// Xử lý lưu trữ bài viết (Tạo mới bài viết hoặc Cập nhật sửa đổi bài viết cũ)
function handleSavePost() {
    document.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
    document.getElementById("tagError").style.display = "none";

    const id = document.getElementById("formPostId").value;
    const titleEle = document.getElementById("formTitle");
    const contentEle = document.getElementById("formContent");
    const imageEle = document.getElementById("formImage");
    const description = document.getElementById("formDescription").value.trim();
    const isPublished = document.getElementById("formPublished").checked;

    const selectedTagIds = [];
    document.querySelectorAll(".form-tag-cb:checked").forEach(cb => {
        selectedTagIds.push(cb.value);
    });

    let isValid = true;
    if (!titleEle.value.trim()) { titleEle.classList.add("is-invalid"); isValid = false; }
    if (!contentEle.value.trim()) { contentEle.classList.add("is-invalid"); isValid = false; }
    
    // Validate bắt buộc điền VÀ định dạng URL ảnh hợp lệ bằng hàm từ utils.js
    if (!imageEle.value.trim() || !isValidImageUrl(imageEle.value.trim())) { 
        imageEle.classList.add("is-invalid"); 
        isValid = false; 
    }
    if (selectedTagIds.length === 0) { document.getElementById("tagError").style.display = "block"; isValid = false; }

    if (!isValid) return;

    const payload = {
    title: titleEle.value.trim(),
    content: contentEle.value.trim(),
    image: imageEle.value.trim(),
    description: description,
    tagIds: selectedTagIds,
    isPublished: isPublished,
    // Đảm bảo cập nhật chính xác mốc thời gian ISO của hệ thống máy chủ đám mây
    createdAt: new Date().toISOString() 
};

    const apiCall = id ? ApiService.updatePost(id, payload) : ApiService.createPost(payload);

    apiCall.then(() => {
        if (blogModalInstance) blogModalInstance.hide();
        initAdminDashboard();
    }).catch(() => alert("Xảy ra lỗi trong quá trình lưu dữ liệu bài viết."));
}

function executeDeletePost(id) {
    if (confirm("Hành động này không thể hoàn tác, bạn có chắc chắn muốn xóa bài viết này không?")) {
        ApiService.deletePost(id).then(() => initAdminDashboard());
    }
}