/**
 * Ảnh + file Word TỰ ĐẢM BẢO — không có nút bấm tay.
 *
 * Gọi khi mở thời khoá biểu và khi sắp gửi. Hỏi máy chủ còn thiếu / đã cũ bao nhiêu tệp (so vân tay số
 * liệu); không thiếu thì xong ngay, không hiện gì. Có thiếu thì tự tạo, hiện tiến độ, tạo lại thì ghi đè
 * đúng tên tệp cũ.
 */
import { esc, so, hopCho, baoCanh } from "./chung.js";

/** → { tao: số tệp đã tạo, ok } */
export async function damBaoTep(tkbId, { gom } = {}) {
  if (!tkbId) return { ok: true, tao: 0 };
  const t = await window.api.tep.thieu(tkbId, { gom }).catch(() => null);
  if (!t?.ok || !t.tong) return { ok: true, tao: 0 };

  const phan = [t.anh ? `${so(t.anh)} ảnh` : "", t.word ? `${so(t.word)} file Word` : ""].filter(Boolean).join(" và ");
  const cho = hopCho("Đang chuẩn bị ảnh và file Word", `${phan} chưa có hoặc đã cũ — phần mềm tự tạo, không cần bấm gì.`);
  const boNghe = window.api.anh.onTienDo((x) => cho.capNhat(`${x.da}/${x.tong} — ${esc(x.ten)}`));
  let r;
  try { r = await window.api.tep.damBao(tkbId, { gom }); }
  finally { boNghe(); cho.dong(); await cho.doi; }

  const loi = [...(r?.loi || []), ...(r?.word?.loi || [])];
  if (loi.length) baoCanh(`<b>Có ${so(loi.length)} tệp chưa tạo được.</b><br>${esc(loi.slice(0, 3).join(" · "))}`);
  return { ok: !loi.length, tao: (r?.tao_moi || 0) + (r?.word?.tao_moi || 0) };
}
