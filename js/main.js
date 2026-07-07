let globalPosts = [];
let globalTags = [];
let globalComments = [];

$(document).ready(function () {
    initPublicPage();

    // dùng JavaScript thuần (Vanilla JS) để bắt sự kiện input, click, submit
    const searchBar = document.getElementById("searchBar");
    if (searchBar) {
        searchBar.addEventListener("input", () => filterAndRenderPosts());
    }

    const tagFilter = document.getElementById("tagFilter");
    if (tagFilter) {
        tagFilter.addEventListener("change", () => filterAndRenderPosts());
    }

    const sortFilter = document.getElementById("sortFilter");
    if (sortFilter) {
        sortFilter.addEventListener("change", () => filterAndRenderPosts());
    }

    const btnBackToList = document.getElementById("btnBackToList");
    if (btnBackToList) {
        btnBackToList.addEventListener("click", switchToListView);
    }
    
    const navPublicLink = document.getElementById("navPublicLink");
    if (navPublicLink) {
        navPublicLink.addEventListener("click", function(e) {
            e.preventDefault();
            switchToListView();
        });
    }

    const commentForm = document.getElementById("commentForm");
    if (commentForm) {
        commentForm.addEventListener("submit", function(e) {
            e.preventDefault(); // Ngăn chặn load lại trang bằng JS thuần
            handleSubmitComment();
        });
    }
});

function initPublicPage() {
    $("#publicSpinner").show();

    ApiService.getPosts()
        .then(posts => {
            globalPosts = posts.filter(p => p.isPublished !== false);
            return ApiService.getTags();
        })
        .then(tags => {
            globalTags = tags;
            return ApiService.getComments();
        })
        .then(comments => {
            globalComments = comments;
            renderFilterOptions();
            filterAndRenderPosts();
        })
        .catch(() => {
            $("#publicPostGrid").html(`<div class="col-12 text-center text-danger my-4">Lỗi tải dữ liệu hệ thống MockAPI!</div>`);
        })
        .finally(() => {
            $("#publicSpinner").hide();
        });
}

function renderFilterOptions() {
    let html = '<option value="">Tất cả các tag nhãn</option>';
    globalTags.forEach(tag => {
        html += `<option value="${tag.id}">${tag.name}</option>`;
    });
    $("#tagFilter").html(html); 
}

function filterAndRenderPosts() {
    const searchKey = $("#searchBar").val().toLowerCase().trim(); 
    const selectedTag = $("#tagFilter").val();
    const sortBy = $("#sortFilter").val();

    let filtered = globalPosts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchKey) || 
                              (post.description && post.description.toLowerCase().includes(searchKey));
        const matchesTag = !selectedTag || (post.tagIds && Array.isArray(post.tagIds) && post.tagIds.some(tagId => String(tagId).trim() === String(selectedTag).trim()));
        return matchesSearch && matchesTag;
    });

    filtered.sort((a, b) => {
        return sortBy === "newest" ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt);
    });

    if (filtered.length === 0) {
        $("#publicPostGrid").html(`<div class="col-12 text-center text-muted my-5">Không tìm thấy bài viết nào phù hợp.</div>`);
        return;
    }

    let html = "";
    filtered.forEach(post => {
        const matchedTags = globalTags.filter(t => {
            return post.tagIds && Array.isArray(post.tagIds) && post.tagIds.some(tagId => String(tagId).trim() === String(t.id).trim());
        });
        const tagsBadgeHtml = matchedTags.map(t => `<span class="badge bg-light text-primary border border-primary-subtle me-1 fw-normal">${t.name}</span>`).join("");
        
        const totalCmt = globalComments.filter(c => {
            return c.postId && String(c.postId).trim() === String(post.id).trim();
        }).length;

        html += `
            <div class="col">
                <div class="card h-100 border-0 shadow-sm rounded-3 overflow-hidden" style="cursor:pointer;" onclick="viewPostDetail('${post.id}')">
                    <img src="${post.image}" class="blog-card-img" alt="Ảnh bìa">
                    <div class="card-body">
                        <h5 class="card-title fw-bold text-dark mb-1 fs-5">${post.title}</h5>
                        <p class="text-muted small mb-2 text-truncate-2">${post.description || 'Chưa có mô tả ngắn...'}</p>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <div class="d-flex flex-wrap">${tagsBadgeHtml}</div>
                            <span class="text-muted small"><i class="bi bi-chat"></i> ${totalCmt}</span>
                        </div>
                    </div>
                </div>
            </div>`;
    });
    $("#publicPostGrid").html(html);
}

function viewPostDetail(id) {
    const post = globalPosts.find(p => String(p.id) === String(id));
    if (!post) return;

    $("#activePostId").val(post.id);
    $("#publicListView").hide();
    $("#publicDetailView").fadeIn(400); 

    const matchedTags = globalTags.filter(t => post.tagIds && post.tagIds.includes(t.id));
    const tagsHtml = matchedTags.map(t => `<span class="badge bg-light text-primary border border-primary-subtle me-1 fw-normal">${t.name}</span>`).join("");

    const detailContainer = document.getElementById("detailArticleContent");
    if (detailContainer) {
        detailContainer.innerHTML = `
            <div class="mb-3">${tagsHtml}</div>
            <h1 class="fw-bold text-dark mb-3">${post.title}</h1>
            <p class="text-muted small mb-4"><i class="bi bi-calendar3"></i> Đăng lúc: ${formatDate(post.createdAt)}</p>
            <div class="text-center mb-4">
                <img src="${post.image}" class="detail-banner-img" alt="Banner">
            </div>
            <div class="fs-5 text-secondary lh-lg mt-4" style="text-align: justify; white-space: pre-line;">
                ${post.content}
            </div>
        `;
    }
    
    renderCommentsForPost(post.id);
    window.scrollTo(0, 0);
}

function switchToListView() {
    $("#publicDetailView").hide();
    $("#publicListView").fadeIn(300);
    $("#commentForm")[0].reset();
    $(".is-invalid").removeClass("is-invalid");
}

// Hàm hiển thị danh sách các bình luận tương ứng với ID bài viết cụ thể
function renderCommentsForPost(postId) {
    const currentPostComments = globalComments.filter(c => {
        return c.postId && String(c.postId).trim() === String(postId).trim();
    });
    
    $("#commentCount").text(currentPostComments.length);
    
    if (currentPostComments.length === 0) {
        $("#commentList").html(`<p class="text-muted small fst-italic">Bài viết chưa có bình luận nào.</p>`);
        return;
    }

    let html = "";
    currentPostComments.forEach(cmt => {
        html += `
            <div class="p-3 bg-white border border-light-subtle rounded-3 shadow-sm d-flex gap-3">
                <div class="fs-3 text-secondary"><i class="bi bi-person-circle"></i></div>
                <div>
                    <div class="d-flex align-items-center gap-2">
                        <h6 class="fw-bold m-0 text-dark small">${cmt.name}</h6>
                        <span class="text-muted" style="font-size:0.75rem;">${formatDate(cmt.createdAt)}</span>
                    </div>
                    <p class="text-secondary small mb-0 mt-1">${cmt.content}</p>
                </div>
            </div>`;
    });
    $("#commentList").html(html);
}

// Hàm kiểm tra dữ liệu Validation và đẩy bình luận mới lên máy chủ
function handleSubmitComment() {
    const postId = $("#activePostId").val();
    const nameEle = $("#cmtName");
    const contentEle = $("#cmtContent");

    let isValid = true;
    $(".is-invalid").removeClass("is-invalid");

    if (!nameEle.val().trim()) { nameEle.addClass("is-invalid"); isValid = false; }
    if (!contentEle.val().trim()) { contentEle.addClass("is-invalid"); isValid = false; }

    if (!isValid) return;

    const payloadComment = {
        postId: postId,
        name: nameEle.val().trim(),
        content: contentEle.val().trim(),
        createdAt: new Date().toISOString()
    };

    ApiService.createComment(payloadComment)
        .then(() => {
            alert("Gửi bình luận thành công!");
            $("#commentForm")[0].reset();
            return ApiService.getComments();
        })
        .then(comments => {
            globalComments = comments;
            renderCommentsForPost(postId);
            filterAndRenderPosts(); 
        })
        .catch(() => alert("Gửi bình luận thất bại."));
}