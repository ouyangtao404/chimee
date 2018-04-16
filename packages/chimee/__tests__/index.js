import Chimee from 'index';
import { Log, getAttr, setAttr, bind } from 'chimee-helper';
import { videoReadOnlyProperties } from 'helper/const';
// import chimeeKernelFlv from 'chimee-kernel-flv';

describe('Chimee', () => {
  let player;
  let originURLrevoke;
  let originCreateElement;

  beforeAll(() => {
    originCreateElement = global.document.createElement;
    global.document.createElement = function(tag) {
      const element = bind(originCreateElement, document)(tag);
      if (tag === 'video') {
        element.play = function() {};
      }
      return element;
    };
  });

  afterAll(() => {
    global.document.createElement = originCreateElement;
  });

  beforeEach(() => {
    Log.data.warn = [];
    Log.data.error = [];
    originURLrevoke = global.URL.revokeObjectURL;
    global.URL.revokeObjectURL = () => {};
  });

  afterEach(() => {
    global.URL.revokeObjectURL = originURLrevoke;
  });

  describe('videoMethods', () => {
    test('canPlayType', () => {
      expect(typeof player.canPlayType('video/mp4')).toBe('string');
    });
  });

  test('destroy', () => {
    expect(player.destroyed).toBe(false);
    expect(() => player.destroy()).not.toThrow();
    expect(player.destroyed).toBe(true);
    expect(player.pause()).rejects.toThrow();
  });

  describe('$attr & $css', () => {
    let player;
    beforeEach(() => {
      player = new Chimee({
        // 播放地址
        src: 'http://cdn.toxicjohann.com/lostStar.mp4',
        // 直播:live 点播：vod
        type: 'vod',
        // 编解码容器
        box: 'native',
        // dom容器
        wrapper: 'body',
        plugin: [],
        events: {},
      });
    });
    afterEach(() => {
      player.destroy();
    });
    test('attr', () => {
      player.attr('container', 'data-id', 1);
      expect(player.attr('container', 'data-id')).toBe('1');
    });
    test('css', () => {
      expect(player.css('container', 'z-index')).toBe('1');
      player.css('container', 'z-index', 10);
      expect(player.css('container', 'z-index')).toBe('10');
    });
    test('attr on video property', () => {
      player.__dispatcher.videoConfigReady = false;
      player.attr('video', 'controls', false);
      expect(player.attr('video', 'controls')).toBe(null);
      player.__dispatcher.videoConfigReady = true;
      player.attr('video', 'controls', false);
      expect(player.attr('video', 'controls')).toBe(null);
    });
    test('attr on video property but it is not in videoconfig', () => {
      player.__dispatcher.videoConfigReady = false;
      player.attr('video', 'data-controls', true);
      expect(player.attr('video', 'data-controls')).toBe(null);
      player.__dispatcher.videoConfigReady = true;
      player.attr('video', 'data-controls', true);
      expect(player.attr('video', 'data-controls')).toBe('true');
    });
  });
  test('focus', () => {
    const player = new Chimee(document.createElement('div'));
    expect(() => player.focus()).not.toThrow();
  });
  test('stop fullscreen', () => {
    const plugin = {
      name: 'stopFullscreen',
      events: {
        beforeFullscreen() {
          return false;
        },
      },
    };
    Chimee.install(plugin);
    const player = new Chimee({
      wrapper: document.createElement('div'),
      plugin: [ 'stopFullscreen' ],
    });
    expect(player.fullscreen()).toBe(false);
  });
});

describe('isFullscreen and fullscreenElement', () => {
  let player;
  let wrapper;
  let originURLrevoke;
  beforeEach(() => {
    wrapper = document.createElement('div');
    document.body.appendChild(wrapper);
    player = new Chimee(wrapper);
    originURLrevoke = global.URL.revokeObjectURL;
    global.URL.revokeObjectURL = () => {};
  });
  afterEach(() => {
    global.URL.revokeObjectURL = originURLrevoke;
    player.exitFullscreen();
    wrapper.parentNode.removeChild(wrapper);
    player.destroy();
  });
  // test('default to be false', () => {
  //   expect(player.isFullscreen).toBe(false);
  //   expect(player.fullscreenElement).toBe();
  // });
  test('wrapper', () => {
    const target = player.__dispatcher.dom.wrapper;
    const fn1 = jest.fn();
    player.$watch('isFullscreen', fn1);
    const fn2 = jest.fn();
    player.$watch('fullscreenElement', fn2);
    player.requestFullscreen('wrapper');
    expect(player.isFullscreen).toBe(true);
    expect(player.__dispatcher.dom[player.fullscreenElement]).toBe(target);
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
    expect(fn1).lastCalledWith(true, false);
    expect(fn2).lastCalledWith('wrapper', undefined);
  });
  test('container', () => {
    const target = player.__dispatcher.dom.container;
    player.requestFullscreen('container');
    expect(player.isFullscreen).toBe(true);
    expect(player.__dispatcher.dom[player.fullscreenElement]).toBe(target);
  });
  test('video', () => {
    const target = player.__dispatcher.dom.videoElement;
    player.requestFullscreen('video');
    expect(player.isFullscreen).toBe(true);
    expect(player.__dispatcher.dom[player.fullscreenElement + 'Element']).toBe(target);
  });
  // test('plugin', () => {
  //   const wrapper = document.createElement('div');
  //   const player = new Chimee({
  //     wrapper,
  //     plugin: [ 'stopFullscreen' ],
  //   });
  //   document.body.appendChild(wrapper);
  //   const target = player.stopFullscreen.$dom;
  //   esFullscreen.open(target);
  //   expect(player.isFullscreen).toBe(true);
  //   expect(player.fullscreenElement).toBe(target);
  //   document.body.removeChild(wrapper);
  // });

  test('fullscreen event and fullscreenchange event', () => {
    const fn = jest.fn();
    const changeFn = jest.fn();
    player.on('fullscreen', fn);
    player.on('fullscreenchange', changeFn);
    player.fullscreen();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(changeFn).toHaveBeenCalledTimes(1);
    player.fullscreen(false);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(changeFn).toHaveBeenCalledTimes(2);
  });

  describe('$video, $container and $wrapper', () => {
    const wrapper = document.createElement('div');
    player = new Chimee(wrapper);
    const container = wrapper.childNodes[0];
    const video = container.childNodes[0];
    const elements = [ video, container, wrapper ];
    [ 'video', 'container', 'wrapper' ].forEach((key, index) => {
      test('key', () => {
        Log.data.warn = [];
        expect(player['$' + key]).toEqual(elements[index]);
        expect(Log.data.warn.length).toBe(1);
        Log.data.warn = [];
      });
    });
  });
});
