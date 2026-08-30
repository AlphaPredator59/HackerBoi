import { CrtBackground } from "@designcodeio/threeui";
import "@designcodeio/threeui/style.css";

export function Scene() {
  return (
    <div className="shader-frame" aria-hidden="true">
      <CrtBackground
        variant="blue-screen"
        speed={1.0}
        motion={1.0}
        hue={0}
        saturation={1.0}
        brightness={1.0}
        opacity={1.0}
      />
    </div>
  );
}
