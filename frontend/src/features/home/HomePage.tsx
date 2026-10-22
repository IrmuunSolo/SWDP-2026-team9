const steps = [
  { title: 'Бүртгэлээ үүсгэх', text: 'Сургуулийн и-мэйл, оюутны кодоороо бүртгүүлнэ.' },
  {
    title: 'И-мэйлээ баталгаажуулах',
    text: 'И-мэйлд ирсэн холбоосыг нээж бүртгэлээ баталгаажуулна.',
  },
  {
    title: 'Зар харах, нийтлэх',
    text: 'Нэвтэрч гээгдсэн, олдсон эд зүйлсийн заруудыг үзэж, өөрийн зараа нэмнэ.',
  },
];

const questions = [
  {
    question: 'Хэн бүртгүүлж болох вэ?',
    answer:
      'Системд зөвшөөрсөн сургуулийн домэйнтэй и-мэйл болон хүчинтэй оюутны кодтой хэрэглэгч бүртгүүлнэ. Заруудыг харах, нийтлэхийн өмнө и-мэйлээ баталгаажуулж нэвтэрсэн байх шаардлагатай.',
  },
  {
    question: 'Баталгаажуулах захиа ирэхгүй бол яах вэ?',
    answer:
      'И-мэйл хаягаа зөв оруулсан эсэх болон spam хавтсаа шалгана уу. Захиа ирээгүй бол ижил и-мэйл, оюутны код, нууц үгээр бүртгэлийн хүсэлтээ дахин илгээнэ үү. Холбоос 24 цаг хүчинтэй, нэг удаа ашиглагдана.',
  },
  {
    question: 'Миний оюутны код бусдад бүтнээр харагдах уу?',
    answer:
      'Нийтлэг зарын жагсаалтад таны нэр болон оюутны кодын хэсгийг B23**** хэлбэрээр харуулна. И-мэйл хаяг, бүтэн оюутны кодыг уг жагсаалтад харуулахгүй. Зар нийтлэхдээ тайлбартаа нууц мэдээлэл оруулахаас зайлсхийгээрэй.',
  },
  {
    question: 'Олдсон эд зүйлийг хаана өгснийг хэрхэн мэдэх вэ?',
    answer:
      'Олдсон зүйлийн зар дээр олсон хүн эзэнтэй биечлэн уулзах эсвэл жижүүрт өгсөн эсэхээ тэмдэглэнэ. Жижүүрт өгсөн бол тухайн байр зар дээр харагдана.',
  },
  {
    question: 'Нэвтрэх оролдлого түр хязгаарлагдвал яах вэ?',
    answer:
      'Нууц үгээ 5 удаа буруу оруулбал нэвтрэх оролдлогыг 10 минут хязгаарлана. Хугацаа өнгөрсний дараа мэдээллээ шалгаж дахин оролдоно уу. Баталгаажсан, идэвхтэй бүртгэлээр нэвтрэх шаардлагатай.',
  },
];

export function HomePage({ member }: { member: boolean }) {
  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div>
          <h1 id="home-title">
            Сургуулийн хүрээнд.
            <br />
            Хамтдаа олъё.
          </h1>
          <p className="home-lead">
            Гээгдсэн, олдсон эд зүйлсийн мэдээллийг нэг дор. Сургуулийн хамт олонтойгоо мэдээллээ
            хуваалцаж, эд зүйлээ олох эхний алхмаа хийгээрэй.
          </p>
          <div className="actions">
            <a className="button-link" href={member ? '/posts' : '/register'}>
              {member ? 'Заруудыг харах' : 'Бүртгэл үүсгэх'}
            </a>
            <a href={member ? '/posts/new/lost' : '/login'}>
              {member ? 'Гээгдсэн зүйл бүртгэх' : 'Нэвтрэх'}
            </a>
          </div>
          <a className="home-how-link" href="#how-it-works">
            Хэрхэн ашиглах вэ?
          </a>
        </div>
        <aside className="home-purpose" aria-label="CampusFind-ийн зориулалт">
          <div>
            <span className="eyebrow">ГЭЭГДСЭН</span>
            <h2>Эд зүйлээ гээсэн үү?</h2>
            <p>Нэр, тайлбар, огноо болон байршлаар нь зар нийтэлж, бусдад танихад нь туслаарай.</p>
          </div>
          <div>
            <span className="eyebrow">ОЛДСОН</span>
            <h2>Эд зүйл олсон уу?</h2>
            <p>
              Олдсон зүйлийн мэдээлэл болон хүлээлгэн өгөх аргыг бүртгэж, эзэндээ хүрэхэд нь
              туслаарай.
            </p>
          </div>
        </aside>
      </section>

      <section id="how-it-works" className="home-section" aria-labelledby="how-title">
        <div className="home-section-heading">
          <h2 id="how-title">Эхлэхэд гурван алхам</h2>
          <p>Зөвхөн баталгаажсан сургуулийн бүртгэлээр зар харах, нийтлэх боломжтой.</p>
        </div>
        <ol className="home-steps">
          {steps.map((step, index) => (
            <li key={step.title}>
              <span className="step-number" aria-hidden="true">
                0{index + 1}
              </span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="faq" className="home-section home-faq" aria-labelledby="faq-title">
        <div className="home-section-heading">
          <h2 id="faq-title">Түгээмэл асуултууд</h2>
          <p>Бүртгэл, баталгаажуулалт, хувийн мэдээллийн тухай.</p>
        </div>
        <div className="faq-list">
          {questions.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
