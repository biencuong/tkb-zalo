#!/usr/bin/env bash
# Giữ lại N bản phát hành mới nhất trên GitHub (mặc định 3), xoá các bản cũ hơn cùng tệp cài.
# GIỮ git tag để còn lịch sử mã; lịch sử thay đổi đầy đủ vẫn ở GHI-CHU-PHAT-HANH.md.
#   bash scripts/don-ban-cu.sh        # giữ 3
#   bash scripts/don-ban-cu.sh 5      # giữ 5
set -euo pipefail
GIU="${1:-3}"
mapfile -t CU < <(gh release list --limit 200 --json tagName,createdAt \
  --jq "sort_by(.createdAt) | reverse | .[$GIU:] | .[].tagName")
if [ "${#CU[@]}" -eq 0 ]; then echo "Không có bản cũ nào cần xoá (đang có ≤ $GIU bản)."; exit 0; fi
for t in "${CU[@]}"; do
  gh release delete "$t" --yes
  echo "Đã xoá bản phát hành $t (giữ tag)"
done
echo "Còn lại:"; gh release list --limit "$GIU"
