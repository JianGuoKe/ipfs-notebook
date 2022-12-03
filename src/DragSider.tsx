import React, {
  CSSProperties,
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import throttle from 'lodash/throttle';

// 实现元素左右拖拽的Hook逻辑
function useLeft2Right(
  resizeLine: MutableRefObject<HTMLDivElement | null>,
  setNavWidth: Dispatch<SetStateAction<number>>
): void {
  useEffect(() => {
    const { current } = resizeLine;

    const mouseDown = (e: MouseEvent): void => {
      const resize = throttle(function (e: MouseEvent) {
        if (e.clientX > 150 && e.clientX < window.innerWidth * 0.8) {
          setNavWidth(e.clientX);
        }
      }, 100);

      const resizeUp = function (): void {
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', resizeUp);
      };

      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', resizeUp);
    };

    (current as HTMLElement).addEventListener('mousedown', mouseDown);

    return function () {
      (current as HTMLElement).removeEventListener('mousedown', mouseDown);
    };
  }, []);
}

// 可以拖拽改变宽度的侧边栏组件
export default function DragSider(props: {
  children: JSX.Element | JSX.Element[];
}): React.ReactElement {
  const { children } = props;

  const [navWidth, setNavWidth] = useState(200);
  const resizeLine = useRef<HTMLDivElement>(null);

  useLeft2Right(resizeLine, setNavWidth);

  const asideStyle: CSSProperties = {
    width: navWidth,
  };

  const resizeLineStyle: CSSProperties = {
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 100,
    width: 3,
    height: '100%',
    // backgroundColor: "white",
    cursor: 'w-resize',
  };

  const rootClassName =
    'ant-layout-sider ant-layout-sider-dark ant-layout-sider-has-trigger';

  return (
    <aside className={rootClassName} style={asideStyle}>
      <div ref={resizeLine} style={resizeLineStyle} />
      {children}
    </aside>
  );
}
