import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Image as KonvaImage, Layer, Stage, Transformer } from 'react-konva';
import type Konva from 'konva';

type Crop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const STAGE_WIDTH = 900;
const STAGE_HEIGHT = 600;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function App() {
  const [source, setSource] = useState<string | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop | null>(null);

  const imageRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (!source) {
      setImage(null);
      setCrop(null);
      return;
    }

    const img = new window.Image();
    img.src = source;
    img.onload = () => {
      setImage(img);
      setCrop({ x: 0, y: 0, width: img.width, height: img.height });
    };
  }, [source]);

  useEffect(() => {
    if (!imageRef.current || !transformerRef.current || !image) return;
    transformerRef.current.nodes([imageRef.current]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [image]);

  const initialSize = useMemo(() => {
    if (!image) return { width: 0, height: 0 };
    const maxDisplayW = STAGE_WIDTH * 0.6;
    const maxDisplayH = STAGE_HEIGHT * 0.6;
    const ratio = Math.min(maxDisplayW / image.width, maxDisplayH / image.height, 1);
    return {
      width: image.width * ratio,
      height: image.height * ratio,
    };
  }, [image]);

  const onFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSource(reader.result as string);
    reader.readAsDataURL(file);
  };

  const updateCrop = (key: keyof Crop, value: number) => {
    if (!image || !crop) return;

    if (key === 'x') {
      const x = clamp(value, 0, Math.max(image.width - crop.width, 0));
      setCrop({ ...crop, x });
      return;
    }

    if (key === 'y') {
      const y = clamp(value, 0, Math.max(image.height - crop.height, 0));
      setCrop({ ...crop, y });
      return;
    }

    if (key === 'width') {
      const width = clamp(value, 20, image.width - crop.x);
      setCrop({ ...crop, width });
      return;
    }

    const height = clamp(value, 20, image.height - crop.y);
    setCrop({ ...crop, height });
  };

  return (
    <div className="app">
      <aside className="panel">
        <h1>React + Konva Image Prototype</h1>
        <p>Upload an image, then drag/resize/rotate on the stage. Use crop sliders to change the visible region.</p>

        <label className="upload">
          <span>Choose image</span>
          <input type="file" accept="image/*" onChange={onFileSelect} />
        </label>

        {image && crop && (
          <div className="crop-controls">
            <h2>Crop</h2>
            {(['x', 'y', 'width', 'height'] as const).map((key) => (
              <label key={key}>
                <span>{key}</span>
                <input
                  type="range"
                  value={Math.round(crop[key])}
                  min={0}
                  max={Math.round(
                    key === 'x'
                      ? image.width - crop.width
                      : key === 'y'
                      ? image.height - crop.height
                      : key === 'width'
                      ? image.width - crop.x
                      : image.height - crop.y
                  )}
                  onChange={(event) => updateCrop(key, Number(event.target.value))}
                />
                <strong>{Math.round(crop[key])}</strong>
              </label>
            ))}
          </div>
        )}
      </aside>

      <main className="stage-wrap">
        <Stage width={STAGE_WIDTH} height={STAGE_HEIGHT} className="stage">
          <Layer>
            {image && crop && (
              <KonvaImage
                ref={imageRef}
                image={image}
                x={STAGE_WIDTH / 2 - initialSize.width / 2}
                y={STAGE_HEIGHT / 2 - initialSize.height / 2}
                width={initialSize.width}
                height={initialSize.height}
                crop={crop}
                draggable
                onTransformEnd={(event) => {
                  const node = event.target;
                  node.setAttrs({
                    width: Math.max(30, node.width() * node.scaleX()),
                    height: Math.max(30, node.height() * node.scaleY()),
                    scaleX: 1,
                    scaleY: 1,
                  });
                }}
              />
            )}
            {image && <Transformer ref={transformerRef} rotateEnabled enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']} />}
          </Layer>
        </Stage>
      </main>
    </div>
  );
}
