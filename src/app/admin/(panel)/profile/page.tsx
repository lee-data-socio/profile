import { adminPage } from "@/lib/auth";
import { getAttachmentsAdmin, getProfileAdmin, getTagSuggestions } from "@/lib/admin-data";
import { AVATAR_BUCKET, MAX_UPLOAD_MB, SUPABASE_URL } from "@/lib/env";
import { ProfileForm, PhotoUploader } from "@/components/admin/profile-form";
import { AttachmentManager } from "@/components/admin/attachment-manager";
import { SectionOrderEditor } from "@/components/admin/section-order-editor";

export default async function ProfileAdminPage() {
  await adminPage();
  const [profile, tags] = await Promise.all([getProfileAdmin(), getTagSuggestions()]);
  const cvFiles = await getAttachmentsAdmin("profile", profile.id);
  const publicBase = `${SUPABASE_URL}/storage/v1/object/public/${AVATAR_BUCKET}`;

  return (
    <>
      <h1 className="font-serif text-2xl font-bold">프로필·CV·섹션 순서</h1>

      <section className="mt-8">
        <h2 className="mb-3 font-bold">프로필 사진</h2>
        <PhotoUploader initialUrl={profile.photo_path ? `${publicBase}/${profile.photo_path}` : null} publicBase={publicBase} />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-bold">기본 정보</h2>
        <ProfileForm profile={profile} interestSuggestions={tags.topic} />
      </section>

      <section className="mt-12">
        <h2 className="font-bold">CV 파일</h2>
        <p className="mb-3 mt-1 text-sm text-muted">
          최신 CV PDF 를 올리고 &lsquo;CV 다운로드에 사용&rsquo;을 선택한 뒤 공개로 바꾸면 홈과 상단 메뉴에 다운로드 버튼이 나타납니다.
        </p>
        <AttachmentManager
          entityType="profile"
          entityId={profile.id}
          initial={cvFiles}
          maxMb={MAX_UPLOAD_MB}
          cvAttachmentId={profile.cv_attachment_id}
        />
      </section>

      <section className="mt-12">
        <h2 className="font-bold">홈 섹션 순서·표시</h2>
        <p className="mb-3 mt-1 text-sm text-muted">연구직 지원은 논문·프로젝트를 위로, 기업 지원은 경력·역량을 위로 올려 보세요.</p>
        <SectionOrderEditor initial={profile.section_order} />
      </section>
    </>
  );
}
