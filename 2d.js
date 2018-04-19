scroller = new SmoothScroll();
active_pane = -1;

function init() {
  setTimeout(() => {window.scrollTo(0, 1);}, 1);

  for (var i = 0; i < window.VIDEOS.length; i++) {
    v = window.VIDEOS[i];
    v.$wrapper = $(`<div class="video_wrapper" style='background-image: url("${v.picFile}");'></div>`);
    $('#video_container')[0].append(v.$wrapper[0]);
    v.$wrapper.on('click', showVideoFactory(i));
  }
  $('#video_container')[0].append($('<div class="video_spacer video_wrapper"></div>')[0]);
  
  showVideo(0);

  window.addEventListener("orientationchange", function() {
    if (active_pane >= 0) {
      scrollToMiddle(window.VIDEOS[active_pane].$player);
    }
  }, false);
  window.addEventListener("fullscreenchange", function() {
    if (active_pane >= 0) {
      scrollToMiddle(window.VIDEOS[active_pane].$player);
    }
  }, false);
}

function getVideo(i) {
  if (!window.VIDEOS[i].player) {
    loadVideo(i);
  }
  return window.VIDEOS[i];
}

function loadVideo(i) {
  v = window.VIDEOS[i];

  $video_container = v.$wrapper[0];
  video_filename = v.vidFile;
  console.log('loading ' + video_filename);
  v.$vidEl = $(`
    <video class="video video-js" id="video_${i}" crossorigin="anonymous" webkit-playsinline playsinline controls data-setup="{}">
      <source src="${video_filename}" type='video/mp4'>
    </video>
  `);
  v.vidEl = v.$vidEl[0];

  v.$wrapper[0].append(v.vidEl);

  v.player = videojs(`video_${i}`, {
    controls: true
  }, function onPlayerReady() {
    this.on('ended', showVideoFactory(i+1));
    console.warn('playerready', i);
  })
  v.$player = $(v.player.el());
}

function showVideoFactory(i) {
  return function() {
    showVideo((i) % window.VIDEOS.length);
  };
}

function showVideo(i) {
  if (i >= window.VIDEOS.length) {
    console.warn(`tried to showPane(${i})`);
    i = 0;
  }

  v = getVideo(i);

  if (active_pane == i) {
    // if (v.player.paused()) {
    //   v.player.play();
    // } else {
    //   v.player.pause();
    // }
    scrollToMiddle(v.$player);
    return;
  }

  var wasFullscreen = false;
  if (document.fullscreenElement && document.fullscreenElement !== document.documentElement) {
    document.exitFullscreen().then(function(result) {
      console.warn('fullscreen closed ', result);
      v.player.requestFullscreen();
    });
    wasFullscreen = true;
  }


  if (active_pane >= 0) {
    a = window.VIDEOS[active_pane];
    stopVid(a);
  }

  active_pane = i % window.VIDEOS.length;
  startVid(v);
}

function startVid(v) {
  v.$player.fadeIn();
  v.player.play();
  scrollToMiddle(v.$player, function(e) {
    v.$player.attr('controls', true);
  });
  // v.$wrapper[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function stopVid(v) {
  a.$player.attr('controls', false);
  a.player.pause();
  a.$player.fadeOut();
}

function scrollToMiddle($el, _callback) {
  var callback = function() {
    setTimeout(() => {window.scrollTo(0, window.scrollY+1);}, 1);
    if (_callback) {
      _callback();
    }
  }
  scroller.animateScroll($el[0], null, {
    offset: (($(window).height() - window.VIDEOS[0].$player.height()) / 2)+1,
    after: callback
  });
}
