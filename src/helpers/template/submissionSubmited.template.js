import dedent from 'dedent';
import FormatRupiah from '../rupiahFormat.js';

const formatSubmissionMessage = (
  submission,
  approval,
  user,
  approver,
  lang = 'id'
) => {
  console.log('🌐 formatSubmissionMessage LANG:', lang);
  const totalAmount = submission.submissionDetail.reduce(
    (sum, detail) => sum + detail.amount * detail.qty,
    0
  );

  const level = approval;

  const responseId = dedent`IFAST Indo

  Permohonan ${submission.type.name} Nomor *${submission.number}* oleh _${
    user.fullName
  }_ pada tanggal ${new Date(
    submission.date
  ).toLocaleDateString()} pukul ${new Date(
    submission.createdAt
  ).toLocaleTimeString()} sedang menunggu approval level ${
    level.sequence
  } oleh ${level.requiredRole} (${approver.fullName})
  
  Detail Pengajuan:
  - Activity : ${submission.activity}
  - Project : ${submission.project.name}
  - Deskripsi : ${submission.description}
  - Type : ${submission.type.name}
  
  Rincian Pengajuan:
  ${submission.submissionDetail
    .map(
      (detail, i) =>
        `${i + 1}. ${detail.name} | ${detail.qty} | ${FormatRupiah(
          detail.amount
        )} | ${FormatRupiah(detail.amount * detail.qty)}`
    )
    .join('\n')}
  
  Total Pengajuan: ${FormatRupiah(totalAmount)}

  > _automatic message created by MIRA © curaweda.com_
  `;

  const responseEn = dedent`IFAST inggris

  ${submission.type.name} Request Number *${submission.number}* by _${
    user.fullName
  }_ on ${new Date(submission.date).toLocaleDateString('en-US')} at ${new Date(
    submission.createdAt
  ).toLocaleTimeString('en-US')} is waiting for level ${
    level.sequence
  } approval by ${level.requiredRole} (${approver.fullName})
  
  Request Details:
  - Activity : ${submission.activity}
  - Project : ${submission.project.name}
  - Description : ${submission.description}
  - Type : ${submission.type.name}
  
  Request Items:
  ${submission.submissionDetail
    .map(
      (detail, i) =>
        `${i + 1}. ${detail.name} | ${detail.qty} | ${FormatRupiah(
          detail.amount
        )} | ${FormatRupiah(detail.amount * detail.qty)}`
    )
    .join('\n')}
  
  Total Amount: ${FormatRupiah(totalAmount)}

  > _automatic message created by MIRA © curaweda.com_
  `;

  return lang === 'en' ? responseEn : responseId;
};

export default formatSubmissionMessage;
