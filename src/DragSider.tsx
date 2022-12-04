import React, {
  CSSProperties,
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import classnames from 'classnames';

// 实现元素左右拖拽的Hook逻辑
function useLeft2Right(
  resizeLine: MutableRefObject<HTMLDivElement | null>,
  minWidth: number,
  setNavWidth: Dispatch<SetStateAction<number>>,
  setNotSelect: Dispatch<SetStateAction<boolean>>
): void {
  useEffect(() => {
    const { current } = resizeLine;

    const mouseDown = (e: MouseEvent): void => {
      let startX: number;
      let left: number;
      let startW: number;
      const resizeStart = function (e: MouseEvent) {
        startX = e.clientX;
        left = resizeLine.current!.parentElement!.offsetLeft;
        startW = resizeLine.current!.parentElement!.offsetWidth;
        setNotSelect(true);
      };

      const resize = function (e: MouseEvent) {
        if (
          e.clientX - left >= minWidth &&
          e.clientX < window.innerWidth * 0.8
        ) {
          setNavWidth(startW + e.clientX - startX);

          // resizeLine.current!.parentElement!.style.width =
          //   startW + e.clientX - startX + 'px';
        }
      };

      const resizeUp = function (): void {
        setNotSelect(false);
        document.removeEventListener('mousedown', resizeStart);
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', resizeUp);
      };

      document.addEventListener('mousedown', resizeStart);
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
  defaultWidth?: number;
  minWidth?: number;
  className?: string | undefined;
  children: JSX.Element | JSX.Element[];
  onClose?: () => void;
}): React.ReactElement {
  const { children, onClose, minWidth = 50 } = props;

  const [notSelect, setNotSelect] = useState(false);
  const [navWidth, setNavWidth] = useState(props.defaultWidth || 200);
  const resizeLine = useRef<HTMLDivElement>(null);

  useLeft2Right(resizeLine, minWidth, setNavWidth, setNotSelect);

  useEffect(() => {
    if (navWidth <= minWidth + minWidth * 0.1 && onClose) {
      onClose();
    }
  }, [notSelect]);

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

  const rootClassName = 'ant-layout-sider ant-layout-sider-dark';

  return (
    <aside
      className={classnames(
        rootClassName,
        props.className,
        notSelect ? 'not-select' : ''
      )}
      style={asideStyle}
    >
      <div ref={resizeLine} style={resizeLineStyle} />
      {children}
    </aside>
  );
}
