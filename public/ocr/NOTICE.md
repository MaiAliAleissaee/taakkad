# Local OCR runtime assets

These static assets are loaded by an explicitly started browser worker, never imported into the SSR application.

- `worker.min.js`: tesseract.js 7.0.0, copied from the installed package. See `WORKER-LICENSE.txt` for bundled notices.
- `tesseract-core-lstm.wasm.js` and `.wasm`: tesseract.js-core 7.0.0. See `CORE-LICENSE` (Apache 2.0).
- Arabic/English fast language data: `https://tessdata.projectnaptha.com/4.0.0_fast/ara.traineddata.gz` and `eng.traineddata.gz` (Tesseract language data, Apache 2.0).

Pinned SHA-256 digests:

```text
worker.min.js 576b7df7e3393e137e51849357c9adb53fe7ac1bb69bfa06cf3d61520f182c6d
tesseract-core-lstm.wasm.js eef5f8b2f8e20e150680b20adaec4a60babafee3adbe8a94583c81fee46e8680
tesseract-core-lstm.wasm 66b17df6e20c5329a17ffa9c202a47eaa3e32500b253d4c7f38e7f2bc01457c3
ara.traineddata.gz cfdec92af6c72289984b03dfe5e03d25f7fee591733081aa6f40761f3f5884cf
eng.traineddata.gz 18c1ac52b75e35d44735fb6c2a60acfaf23033524653200738e98f0243edb75b
```

OCR uses `cacheMethod: "none"`; source images/text are not saved in an OCR browser cache. Deployment/CDN caching of these public runtime/language assets does not contain visitor images.