import { Suspense, createResource } from "solid-js";
import { Img, createURL } from "../utils/img";

export const Thumbnail = ({ img }: { img: Img }) => {
  const [url] = createResource(img, createURL);

  return (
    <div class="flex w-56 flex-col items-center justify-center">
      <div class="flex h-56 w-56 items-center justify-center" title={`${img.width}x${img.height}`}>
        <Suspense>
          <img
            src={url()}
            class="max-h-full max-w-full border object-contain"
            style={{
              background:
                "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUAQMAAAC3R49OAAAABlBMVEX////09PQtDxrOAAAAE0lEQVQI12P4f4CBKMxg/4EYDAAFkR1NiYvv7QAAAABJRU5ErkJggg==')",
            }}
          />
        </Suspense>
      </div>
      <p class="max-w-full truncate p-1" title={img.name}>
        {img.name}
      </p>
    </div>
  );
};
