import { Suspense } from "react";
import { notFound } from "next/navigation";

/**
 * 맞는 페이지가 없는 주소(/en/foo 등)는 next.config 의 fallback rewrite 로 여기 와서
 * 언어에 맞는 [lang]/not-found.tsx 를 404 로 보여 준다.
 * notFound() 를 Suspense 안에서 던져야 정적 생성 때 <html lang> 이 있는 404 문서가 만들어진다
 * (바깥에서 던지면 Next 가 lang 없는 오류 셸 <html id="__next_error__"> 를 보낸다).
 * 개발 서버는 요청 때 렌더링하므로 이 경우 200 으로 응답한다 (상세 페이지의 404 와 같음).
 */
function NotFound(): never {
  notFound();
}

export default function Missing() {
  return (
    <Suspense>
      <NotFound />
    </Suspense>
  );
}
