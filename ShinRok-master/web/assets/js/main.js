
(function($) {

	var	$window = $(window),
		$head = $('head'),
		$body = $('body');

	// Breakpoints.
		breakpoints({
			xlarge:   [ '1281px',  '1680px' ],
			large:    [ '981px',   '1280px' ],
			medium:   [ '737px',   '980px'  ],
			small:    [ '481px',   '736px'  ],
			xsmall:   [ '361px',   '480px'  ],
			xxsmall:  [ null,      '360px'  ],
			'xlarge-to-max':    '(min-width: 1681px)',
			'small-to-xlarge':  '(min-width: 481px) and (max-width: 1680px)'
		});

	// 페이지가 표시될 때까지 애니메이션/전환을 중지

		// load
			$window.on('load', function() {
				window.setTimeout(function() {
					$body.removeClass('is-preload');
				}, 100);
			});

		// resizing 중단
			var resizeTimeout;

			$window.on('resize', function() {

				// 크기조정 표시
					$body.addClass('is-resizing');

				// 지연후 표시 해제
					clearTimeout(resizeTimeout);

					resizeTimeout = setTimeout(function() {
						$body.removeClass('is-resizing');
					}, 100);

			});

			// 이미지 고정
			if (!browser.canUse('object-fit')
			||	browser.name == 'safari')
				$('.image.object').each(function() {

					var $this = $(this),
						$img = $this.children('img');

					// 원본 이미지 숨김
						$img.css('opacity', '0');

					// 배경 설정
						$this
							.css('background-image', 'url("' + $img.attr('src') + '")')
							.css('background-size', $img.css('object-fit') ? $img.css('object-fit') : 'cover')
							.css('background-position', $img.css('object-position') ? $img.css('object-position') : 'center');

				});

	// 사이드바 움직임
		var $sidebar = $('#sidebar'),
			$sidebar_inner = $sidebar.children('.inner');

		// 기본적으로 비활성 (large)
			breakpoints.on('<=large', function() {
				$sidebar.addClass('inactive');
			});

			breakpoints.on('>large', function() {
				$sidebar.removeClass('inactive');
			});

		// Toggle
			$('<a href="#sidebar" class="toggle">Toggle</a>')
				.appendTo($sidebar)
				.on('click', function(event) {

					// 기본값 방지
						event.preventDefault();
						event.stopPropagation();

					// Toggle
						$sidebar.toggleClass('inactive');

				});

		// 이벤트 요소

			// a 태그 요소 클릭시 이벤트
				$sidebar.on('click', 'a', function(event) {
						var $a = $(this),
							href = $a.attr('href'),
							target = $a.attr('target');

					// 기본값 방지
						event.preventDefault();
						event.stopPropagation();

					// URL 클릭시
						if (!href || href == '#' || href == '')
							return;

					// 사이드바 숨김
						$sidebar.addClass('inactive');

					// 리디렉션
						setTimeout(function() {

							if (target == '_blank')
								window.open(href);
							else
								window.location.href = href;

						}, 500);

				});

			// 사이드바 특정 이벤트 전파 방지
				$sidebar.on('click touchend touchstart touchmove', function(event) {

					// 현재 화면 크기가 'large'보다 크다면 함수 종료
						if (breakpoints.active('>large'))
							return;

					// 부모요소로 전달되지 않도록 막음
						event.stopPropagation();

				});

			// 바디 클릭/탭 시 사이드바 숨기기
				$body.on('click touchend', function(event) {

						if (breakpoints.active('>large'))
							return;

					// 비활성화(숨김)
						$sidebar.addClass('inactive');

				});

		// 스크롤 잠금

			$window.on('load.sidebar-lock', function() {

				var sh, wh, st;

				// 스크롤 위치가 1이면 0으로 재설정
					if ($window.scrollTop() == 1)
						$window.scrollTop(0);

				$window
					.on('scroll.sidebar-lock', function() {

						var x, y;

						// 사이드바의 잠금 해제하고 위치 초기화
							if (breakpoints.active('<=large')) {

								$sidebar_inner
									.data('locked', 0)
									.css('position', '')
									.css('top', '');

								return;

							}

						// 스크롤바 위치 조정
							x = Math.max(sh - wh, 0);
							y = Math.max(0, $window.scrollTop() - x);

						// Lock/unlock.
							if ($sidebar_inner.data('locked') == 1) {

								if (y <= 0)
									$sidebar_inner
										.data('locked', 0)
										.css('position', '')
										.css('top', '');
								else
									$sidebar_inner
										.css('top', -1 * x);

							}
							else {

								if (y > 0)
									$sidebar_inner
										.data('locked', 1)
										.css('position', 'fixed')
										.css('top', -1 * x);

							}

					})
					.on('resize.sidebar-lock', function() {

						// 높이 계산
							wh = $window.height();
							sh = $sidebar_inner.outerHeight() + 30;

						// 스크롤 이벤트 트리거
							$window.trigger('scroll.sidebar-lock');

					})
					.trigger('resize.sidebar-lock');

				});


	// sidebar안에 게시판 토글
		var $menu = $('#menu'),
			$menu_openers = $menu.children('ul').find('.opener');

			$menu_openers.each(function() {

				var $this = $(this);

				$this.on('click', function(event) {

						event.preventDefault();

					// Toggle
						$menu_openers.not($this).removeClass('active');
						$this.toggleClass('active');

					// 사이드바 잠금 (트리거 크기 조정)
						$window.triggerHandler('resize.sidebar-lock');

				});

			});

})(jQuery);


document.addEventListener('DOMContentLoaded', function() {
	var links = document.querySelectorAll('.postList a');
	var currentUrl = window.location.pathname;

	links.forEach(function(link) {
		if (link.getAttribute('href') === currentUrl) {
			link.classList.add('active');
		}
	});
});




//  페이징 처리하는 부분 --------------------------------------------------------------------------
// 페이지 정보
const pageInfo = {
    totalPosts: 190,          // 모든 글 개수
    currentPage: 10,          // 현재 페이지 번호
    postsPerPage: 10,         // 한 페이지당 표시할 글 개수
    displayPageNum: 5         // 한 번에 표시할 페이지 개수
};

// 총 페이지 수 계산
function totalPages(totalPosts, postsPerPage) {
    return Math.ceil(totalPosts / postsPerPage);
}

// 마지막 페이지 계산
function endPage(currentPage, displayPageNum, totalPages) {
    let endPage = Math.ceil(currentPage / displayPageNum) * displayPageNum;
    return Math.min(endPage, totalPages);
}

// 첫 페이지 계산
function startPage(currentPage, displayPageNum) {
    return Math.floor((currentPage - 1) / displayPageNum) * displayPageNum + 1;
}

// 이전 페이지 여부 확인
function hasPrev(startPage) {
    return startPage > 1;
}

// 다음 페이지 여부 확인
function hasNext(endPage, totalPages) {
    return endPage < totalPages;
}

// 페이지네이션 출력
function printPages(pageInfo) {
    const totalPagesCount = totalPages(pageInfo.totalPosts, pageInfo.postsPerPage);
    const startPageNum = startPage(pageInfo.currentPage, pageInfo.displayPageNum);
    const endPageNum = endPage(pageInfo.currentPage, pageInfo.displayPageNum, totalPagesCount);
    const hasPrevPage = hasPrev(startPageNum);
    const hasNextPage = hasNext(endPageNum, totalPagesCount);

    let paginationHtml = '';

    if (hasPrevPage) {
        paginationHtml += `<a href="?page=1">&laquo; 처음</a>`;
        paginationHtml += `<a href="?page=${startPageNum - pageInfo.displayPageNum}">이전</a>`;
    }

    for (let page = startPageNum; page <= endPageNum; page++) {
        if (page === pageInfo.currentPage) {
            paginationHtml += `<span class="current">${page}</span>`;
        } else {
            paginationHtml += `<a href="?page=${page}">${page}</a>`;
        }
    }

    if (hasNextPage) {
        paginationHtml += `<a href="?page=${endPageNum + 1}">다음</a>`;
        paginationHtml += `<a href="?page=${totalPagesCount}">&raquo; 마지막</a>`;
    }

    document.getElementById('pagination-container').innerHTML = paginationHtml;
}

// 페이지네이션 출력 함수 호출
printPages(pageInfo);



// ------------------ 메인페이지 배너 -------------------
