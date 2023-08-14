import { Suspense, createResource } from "solid-js";
import { Img, createURL } from "../utils/img";

export const Thumbnail = ({ img }: { img: Img }) => {
  const [url] = createResource(img, createURL);

  return (
    <div class="flex items-center flex-col justify-center">
      <div class="w-56 h-56 flex items-center justify-center">
        <Suspense>
          <img
            src={url()}
            class="object-contain max-h-full max-w-full border"
            style={{
              background:
                "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUAQMAAAC3R49OAAAABlBMVEX////09PQtDxrOAAAAE0lEQVQI12P4f4CBKMxg/4EYDAAFkR1NiYvv7QAAAABJRU5ErkJggg==')",
            }}
          />
        </Suspense>
      </div>
      <p class="max-w-full p-1 truncate">{img.name}</p>
    </div>
  );
};
