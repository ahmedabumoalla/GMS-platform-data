'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import { 
  ArrowLeft, ArrowRight, Zap, Users, 
  LayoutDashboard, Phone, Globe, Activity,
  Sun, Moon, Briefcase, MapPin, ChevronDown, Eye, Target, Crosshair, Mail, Clock,
  CheckCircle2, ShieldCheck, Timer, X, Facebook, Twitter, Instagram, Linkedin, 
  Wrench, Scissors, Box, Layers, Hammer, Settings
} from 'lucide-react';

// --- مكونات مساعدة (كما هي لقوتها في التصميم) ---

const SpotlightCard = ({ children, className = "", isDark }: any) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={() => setOpacity(1)}
      onBlur={() => setOpacity(0)}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden rounded-3xl border transition-colors duration-300 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'} ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 z-0"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)'}, transparent 40%)`,
        }}
      />
      <div className="relative h-full z-10">{children}</div>
    </div>
  );
};

const FadeIn = ({ children, delay = 0, direction = 'up' }: any) => (
  <motion.div
    initial={{ opacity: 0, y: direction === 'up' ? 30 : 0, x: direction === 'left' ? 30 : direction === 'right' ? -30 : 0 }}
    whileInView={{ opacity: 1, y: 0, x: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.7, delay, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

const CinematicBackgroundLogo = ({ isDark }: { isDark: boolean }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX - window.innerWidth / 2) / 50, 
        y: (e.clientY - window.innerHeight / 2) / 50,
      });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const springX = useSpring(mousePosition.x, { stiffness: 50, damping: 20 });
  const springY = useSpring(mousePosition.y, { stiffness: 50, damping: 20 });

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className={`absolute inset-0 z-10 ${isDark ? 'bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-950' : 'bg-gradient-to-b from-slate-50 via-slate-50/95 to-slate-50'}`}></div>
      <motion.div
        style={{ x: springX, y: springY }}
        className={`absolute top-1/2 left-1/2 w-[120vw] h-[120vh] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-0 transition-opacity duration-1000 ${isDark ? 'opacity-[0.03]' : 'opacity-[0.015]'}`}
      >
        {/* استخدمنا أيقونة كبيرة كخلفية سينمائية بدلاً من اللوجو المفقود */}
        <Settings size={800} className="text-slate-500" />
      </motion.div>
    </div>
  );
};

export default function Home() {
  const [lang, setLang] = useState<'ar' | 'en' | 'ur'>('ar');
  const [isDark, setIsDark] = useState(false); 
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  const toggleTheme = () => setIsDark(prev => !prev);
  const isRTL = lang === 'ar' || lang === 'ur';

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    if (hour >= 18 || hour < 6) setIsDark(true);
    
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const content = {
    ar: {
      nav: { services: 'خدماتنا', projects: 'معرض الأعمال', whyUs: 'لماذا نحن', about: 'عن الورشة', contact: 'اطلب تسعيرة', portal: 'دخول الموظفين', currentLang: 'العربية' },
      hero: {
        badge: 'دقة متناهية - تقنية CNC - تشكيل المعادن',
        title1: 'شركة أشكال وأكثر للتجارة',
        desc: 'متخصصون في أعمال قص الحديد والمعادن باستخدام أحدث تقنيات الـ CNC والليزر. نقدم حلولاً متكاملة للواجهات المعمارية، الديكورات المعدنية، وأعمال الحدادة الفنية بدقة هندسية لا تضاهى لتلبية احتياجات المشاريع السكنية والتجارية والصناعية.',
        cta1: 'تصفح أعمالنا', cta2: 'تواصل معنا الآن',
      },
      about: {
        title: 'هويتنا ومبادئنا', subtitle: 'نحول الألواح المعدنية الصماء إلى تحف فنية',
        vision: { title: 'الرؤية', text: 'أن نكون الخيار الأول والشركة الرائدة في المملكة لتنفيذ أعمال القص والتشكيل المعدني المبتكر بأعلى معايير الجودة العالمية.' },
        mission: { title: 'الرسالة', text: 'تطويع الحديد وتشكيله بدقة عالية باستخدام التكنولوجيا الحديثة (CNC) لتقديم منتجات تجمع بين المتانة والجمال المعماري لعملائنا.' },
        goals: { title: 'الأهداف', text: 'الدقة المتناهية في المقاسات، الالتزام التام بمواعيد التسليم، الابتكار المستمر في التصاميم المعدنية، وضمان أعلى درجات الأمان.' }
      },
      services: {
        title: 'تخصصاتنا الفنية',
        items: [
          { 
            title: 'قص ليزر & CNC', shortDesc: 'قص بدقة ميكرومترية لجميع أنواع المعادن ⚙️', icon: Scissors,
            fullDesc: 'نستخدم أحدث ماكينات الليزر والـ CNC لقص ألواح الحديد والاستانلس ستيل والنحاس. نضمن لك دقة متناهية في التفاصيل المعقدة والزخارف الإسلامية والهندسية للواجهات والأبواب.',
            bullets: [
              'قص ألواح الحديد بسماكات مختلفة لتناسب كافة المشاريع',
              'تنفيذ الزخارف الهندسية والنقوش الإسلامية الدقيقة',
              'قص الاستانلس ستيل اللامع والمطفي للديكورات',
              'إنتاج قطع الغيار الصناعية حسب المخططات الهندسية',
              'تفريغ اللوحات الإعلانية واللوجوهات المعدنية للشركات'
            ]
          },
          { 
            title: 'أعمال الحدادة الفنية', shortDesc: 'هياكل معدنية، أبواب، وسواتر بتصاميم عصرية 🔨', icon: Hammer,
            fullDesc: 'فريق من الحدادين المهرة لتنفيذ كافة أعمال الحدادة التقليدية والمبتكرة، من حماية النوافذ إلى الهياكل الإنشائية الخفيفة، مع مراعاة أعلى معايير اللحام والمتانة.',
            bullets: [
              'تصنيع وتركيب الأبواب الخارجية والمداخل الرئيسية الفخمة',
              'تنفيذ الدرابزينات وسلالم الطوارئ الآمنة',
              'تركيب سواتر ومظلات حديدية مدمجة مع قص الليزر',
              'تصنيع الأثاث المعدني المودرن (طاولات، كراسي، رفوف)',
              'أعمال اللحام التخصصي والتشطيب الخالي من العيوب'
            ]
          },
          { 
            title: 'الديكورات المعدنية', shortDesc: 'لمسات فنية من المعدن للديكور الداخلي والخارجي ✨', icon: Layers,
            fullDesc: 'نصمم وننفذ قطع الديكور المعدنية التي تضفي فخامة على المكان، مثل القواطع (Partitions) الجدارية، تجليد الواجهات، وإطارات المرايا واللوحات الجمالية.',
            bullets: [
              'قواطع داخلية (Partitions) لتقسيم المساحات المفتوحة',
              'تجليد الحوائط والواجهات بالألواح المعدنية المزخرفة',
              'تصميم وتصنيع إكسسوارات منزلية معدنية حسب الطلب',
              'تنفيذ واجهات المحلات التجارية بالحديد المفرغ',
              'معالجة المعادن وطلائها بألوان مقاومة للصدأ والعوامل الجوية'
            ]
          },
        ]
      },
      whyUs: {
        title: 'لماذا تختارنا؟',
        subtitle: 'تكنولوجيا متطورة، ويد عاملة خبيرة',
        commitmentTitle: 'الجودة هي معيارنا الأساسي',
        commitmentText: 'في شركة أشكال وأكثر، لا نكتفي بالقص فقط، بل نهتم بجودة الحواف، استقامة الألواح، ودقة المقاسات. نستخدم أفضل أنواع الحديد الخام ونضمن معالجة الأسطح ضد الصدأ لضمان استدامة المنتج لعشرات السنين.',
        stats: [
            { num: 'CNC', label: 'أحدث الماكينات' }, { num: '+500', label: 'تصميم هندسي جاهز' },
            { num: '0.1mm', label: 'نسبة الخطأ' }, { num: '100%', label: 'رضا العملاء' }
        ],
        pillars: [
            { title: 'دقة الـ CNC', desc: 'استخدام التكنولوجيا يضمن تطابق المنتج النهائي مع الرسم الهندسي بنسبة 100%.', icon: Settings },
            { title: 'سرعة التنفيذ', desc: 'نلتزم بجداول زمنية صارمة لتسليم مشاريع المقاولات وطلبات الأفراد في الوقت المحدد.', icon: Timer },
            { title: 'تنوع الخيارات', desc: 'مكتبة ضخمة من التصاميم والأشكال تناسب جميع الأذواق الكلاسيكية والمودرن.', icon: Box }
        ]
      },
      projects: {
        title: 'معرض الأعمال', subtitle: 'نماذج من إبداعاتنا في قص وتشكيل المعادن',
        items: [
          { name: 'واجهة فيلا مودرن', cat: 'قص ليزر', loc: 'الرياض', status: 'مكتمل', duration: '10 أيام', teams: 'فريق التركيب', desc: 'تجليد كامل لواجهة الفيلا بألواح حديد مقصوصة ليزر بنقوش عصرية ومطلية حرارياً.', image: '/pic1.png' },
          { name: 'أبواب قصر خارجية', cat: 'حدادة وفن', loc: 'جدة', status: 'مكتمل', duration: '15 يوم', teams: 'فنيين لحام', desc: 'تصنيع أبواب ضخمة تجمع بين الحديد المشغول الكلاسيكي والتطعيم بقص الليزر.', image: '/pic2.png' },
          { name: 'قواطع مكتبية ديكورية', cat: 'ديكور داخلي', loc: 'الدمام', status: 'قيد التنفيذ', duration: '7 أيام', teams: 'فريق الديكور', desc: 'تنفيذ قواطع داخلية من الاستانلس ستيل الذهبي لتقسيم مكاتب شركة كبرى.', image: '/pic3.png' },
        ]
      },
      partners: { title: 'شركاء النجاح والثقة' },
      contact: { title: 'ابدأ مشروعك معنا', desc: 'أرسل لنا مخططك الهندسي أو فكرتك، وسيقوم فريقنا بتحويلها إلى واقع معدني ملموس بدقة عالية.', call: 'المبيعات والاستفسارات:', email: 'البريد الإلكتروني:' },
      footer: { rights: '© 2026 شركة أشكال وأكثر للتجارة. جميع الحقوق محفوظة.' }
    },
    en: {
      // تم تغيير portal إلى "Staff Login"
      nav: { services: 'Services', projects: 'Portfolio', whyUs: 'Why Us', about: 'About', contact: 'Get Quote', portal: 'Staff Login', currentLang: 'English' },
      hero: { badge: 'High Precision - CNC Tech - Metal Forming', title1: 'Ashkal & More Trading Co.', desc: 'Specializing in metal and iron cutting using the latest CNC and Laser technologies. We provide integrated solutions for architectural facades, metal decorations, and artistic blacksmithing with unmatched precision.', cta1: 'View Portfolio', cta2: 'Contact Us Now' },
      about: { title: 'Our Identity', subtitle: 'Transforming solid metal into artistic masterpieces', vision: { title: 'Vision', text: 'To be the leading company in Saudi Arabia for innovative metal cutting and forming with the highest global quality standards.' }, mission: { title: 'Mission', text: 'Shaping iron with high precision using modern CNC tech to deliver products combining durability and beauty.' }, goals: { title: 'Goals', text: 'Extreme dimensional accuracy, strict commitment to delivery times, continuous innovation, and safety assurance.' } },
      services: {
        title: 'Our Technical Specialties',
        items: [
          { title: 'Laser & CNC Cutting', shortDesc: 'Micrometric precision cutting for all metals ⚙️', icon: Scissors, fullDesc: 'Using the latest Laser and CNC machines for cutting iron, stainless steel, and copper. We guarantee extreme precision in complex details and geometric patterns.', bullets: ['Cutting iron plates of various thicknesses', 'Executing intricate geometric and Islamic patterns', 'Cutting glossy and matte stainless steel', 'Producing industrial parts based on blueprints', 'Creating metal signs and corporate logos'] },
          { title: 'Artistic Blacksmithing', shortDesc: 'Metal structures, doors, and modern fences 🔨', icon: Hammer, fullDesc: 'A team of skilled blacksmiths for traditional and innovative works, from window protections to light structural frames, ensuring top welding standards.', bullets: ['Manufacturing luxurious exterior doors and entrances', 'Executing safe handrails and fire escapes', 'Installing laser-cut integrated fences', 'Manufacturing modern metal furniture', 'Specialized welding and flawless finishing'] },
          { title: 'Metal Decorations', shortDesc: 'Artistic metal touches for interior and exterior ✨', icon: Layers, fullDesc: 'Designing and executing metal decor pieces that add luxury to spaces, such as wall partitions, facade cladding, and aesthetic frames.', bullets: ['Interior partitions for open spaces', 'Wall cladding with decorative metal panels', 'Custom-made metal home accessories', 'Commercial storefronts with hollowed iron', 'Anti-rust metal treatment and painting'] }
        ]
      },
      whyUs: { title: 'Why Choose Us?', subtitle: 'Advanced Tech & Expert Hands', commitmentTitle: 'Quality is Our Standard', commitmentText: 'At Ashkal & More, we do not just cut; we care about edge quality, plate straightness, and size accuracy. We use premium raw iron and guarantee anti-rust surface treatments.', stats: [{ num: 'CNC', label: 'Latest Machines' }, { num: '500+', label: 'Ready Designs' }, { num: '0.1mm', label: 'Error Margin' }, { num: '100%', label: 'Client Satisfaction' }], pillars: [{ title: 'CNC Precision', desc: 'Technology ensures the final product matches the drawing 100%.', icon: Settings }, { title: 'Fast Execution', desc: 'Strict timelines for delivering contracting and individual projects.', icon: Timer }, { title: 'Diverse Options', desc: 'A massive library of designs for classic and modern tastes.', icon: Box }] },
      projects: { title: 'Our Portfolio', subtitle: 'A glimpse of our creations in metal cutting', items: [{ name: 'Modern Villa Facade', cat: 'Laser Cut', loc: 'Riyadh', status: 'Completed', duration: '10 Days', teams: 'Installation Team', desc: 'Full facade cladding with laser-cut iron panels with modern patterns.', image: '/pic1.png' }, { name: 'Palace Exterior Doors', cat: 'Blacksmithing', loc: 'Jeddah', status: 'Completed', duration: '15 Days', teams: 'Welding Techs', desc: 'Huge doors combining classic wrought iron with laser-cut inserts.', image: '/pic2.png' }, { name: 'Decorative Partitions', cat: 'Interior Decor', loc: 'Dammam', status: 'Ongoing', duration: '7 Days', teams: 'Decor Team', desc: 'Golden stainless steel partitions for a major corporate office.', image: '/pic3.png' }] },
      partners: { title: 'Partners in Success' },
      contact: { title: 'Start Your Project', desc: 'Send us your blueprint or idea, and our team will turn it into a tangible metal reality with high precision.', call: 'Sales & Inquiries:', email: 'Email:' },
      footer: { rights: '© 2026 Ashkal & More Trading Co. All rights reserved.' }
    },
    ur: {
      // تم تغيير portal إلى "اسٹاف لاگ ان"
      nav: { services: 'خدمات', projects: 'پورٹ فولیو', whyUs: 'ہم کیوں', about: 'ہمارے بارے میں', contact: 'رابطہ کریں', portal: 'اسٹاف لاگ ان', currentLang: 'اردو' },
      hero: { badge: 'اعلی درستگی - CNC ٹیکنالوجی - دھاتی تشکیل', title1: 'اشکال اینڈ مور ٹریڈنگ کو', desc: 'جدید ترین CNC اور لیزر ٹیکنالوجی کا استعمال کرتے ہوئے دھات اور لوہے کی کٹائی میں مہارت۔ ہم آرکیٹیکچرل اگواڑے اور دھاتی سجاوٹ کے لیے حل فراہم کرتے ہیں۔', cta1: 'پورٹ فولیو دیکھیں', cta2: 'ابھی رابطہ کریں' },
      about: { title: 'ہماری شناخت', subtitle: 'ٹھوس دھات کو آرٹ میں تبدیل کرنا', vision: { title: 'نقطہ نظر', text: 'سعودی عرب میں دھاتی کٹائی کے لیے معروف کمپنی بننا۔' }, mission: { title: 'مشن', text: 'اعلی درستگی کے ساتھ لوہے کو شکل دینا۔' }, goals: { title: 'مقاصد', text: 'درستگی، وقت کی پابندی، اور جدت۔' } },
      services: { title: 'ہماری تکنیکی خصوصیات', items: [{ title: 'لیزر اور CNC کٹنگ', shortDesc: 'دھاتوں کے لیے مائیکرو میٹرک درستگی ⚙️', icon: Scissors, fullDesc: 'ہم لوہے اور سٹیل کو کاٹنے کے لیے جدید ترین CNC مشینیں استعمال کرتے ہیں۔', bullets: ['مختلف موٹائی کی کٹائی', 'ہندسی اور اسلامی ڈیزائن', 'پرزوں کی تیاری'] }, { title: 'آرٹسٹک بلیک اسمتھنگ', shortDesc: 'دھاتی ڈھانچے اور جدید دروازے 🔨', icon: Hammer, fullDesc: 'ہمارے ہنر مند لوہار روایتی اور جدید کاموں کے لیے تیار ہیں۔', bullets: ['بیرونی دروازے بنانا', 'حفاظتی ریلنگ', 'دھاتی فرنیچر'] }, { title: 'دھاتی سجاوٹ', shortDesc: 'اندرونی اور بیرونی سجاوٹ ✨', icon: Layers, fullDesc: 'ہم دھاتی ڈیکوریشن کے ٹکڑے ڈیزائن کرتے ہیں جو جگہ میں خوبصورتی کا اضافہ کرتے ہیں۔', bullets: ['اندرونی پارٹیشنز', 'دھاتی پینلز سے دیوار کی سجاوٹ', 'حسب ضرورت لوازمات'] }] },
      whyUs: { title: 'ہمیں کیوں منتخب کریں؟', subtitle: 'جدید ٹیکنالوجی اور ماہر ہاتھ', commitmentTitle: 'معیار ہمارا معیار ہے', commitmentText: 'ہم صرف کاٹتے نہیں ہیں؛ ہم کناروں کے معیار اور سائز کی درستگی کا خیال رکھتے ہیں۔', stats: [{ num: 'CNC', label: 'جدید مشینیں' }, { num: '500+', label: 'تیار ڈیزائن' }, { num: '0.1mm', label: 'غلطی کا مارجن' }, { num: '100%', label: 'گاہک کا اطمینان' }], pillars: [{ title: 'CNC کی درستگی', desc: 'پروڈکٹ ڈرائنگ سے 100% میل کھاتا ہے۔', icon: Settings }, { title: 'تیز تکمیل', desc: 'منصوبوں کی بروقت فراہمی۔', icon: Timer }, { title: 'متنوع اختیارات', desc: 'کلاسک اور جدید ذوق کے لیے ڈیزائن۔', icon: Box }] },
      projects: { title: 'ہمارا پورٹ فولیو', subtitle: 'دھات کی کٹائی میں ہماری تخلیقات کی ایک جھلک', items: [{ name: 'جدید ولا کا اگواڑا', cat: 'لیزر کٹ', loc: 'ریاض', status: 'مکمل', duration: '10 دن', teams: 'انسٹالیشن ٹیم', desc: 'لیزر کٹ لوہے کے پینلز کے ساتھ مکمل اگواڑا۔', image: '/pic1.png' }, { name: 'محل کے بیرونی دروازے', cat: 'بلیک اسمتھنگ', loc: 'جدہ', status: 'مکمل', duration: '15 دن', teams: 'ویلڈنگ ٹیم', desc: 'لیزر کٹ کے ساتھ کلاسک لوہے کے بڑے دروازے۔', image: '/pic2.png' }, { name: 'آرائشی پارٹیشنز', cat: 'اندرونی سجاوٹ', loc: 'دمام', status: 'جاری', duration: '7 دن', teams: 'ڈیکور ٹیم', desc: 'ایک کارپوریٹ دفتر کے لیے گولڈن سٹینلیس سٹیل پارٹیشنز۔', image: '/pic3.png' }] },
      partners: { title: 'کامیابی کے شراکت دار' },
      contact: { title: 'اپنا پروجیکٹ شروع کریں', desc: 'ہمیں اپنا بلیو پرنٹ بھیجیں، ہماری ٹیم اسے دھاتی حقیقت میں بدل دے گی۔', call: 'پوچھ گچھ:', email: 'ای میل:' },
      footer: { rights: '© 2026 اشکال اینڈ مور ٹریڈنگ کو۔ جملہ حقوق محفوظ ہیں۔' }
    }
  };
  
  const c = content[lang as 'ar'|'en'|'ur'];
  const textMain = isDark ? "text-white" : "text-slate-900";

  if (!mounted) return <div className="min-h-screen bg-slate-900"></div>;

  return (
    <div className={`min-h-screen font-sans selection:bg-blue-500 selection:text-white transition-colors duration-500 overflow-x-hidden relative scroll-smooth ${isRTL ? 'dir-rtl' : 'dir-ltr'} ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      <CinematicBackgroundLogo isDark={isDark} />

      {/* --- Navbar --- */}
      <motion.nav 
        initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'h-20 bg-opacity-90 backdrop-blur-xl border-b shadow-sm' : 'h-24 bg-transparent border-transparent'} ${isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-white/80'}`}
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-4 group z-10">
            {/* اللوجو النصي الاحترافي لشركة أشكال وأكثر */}
            <div className="flex flex-col">
               <span className={`text-2xl font-black tracking-tighter leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                 ASHKAL <span className="text-blue-600">& MORE</span>
               </span>
               <span className={`text-[10px] font-bold tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'} ${isRTL ? 'text-right' : 'text-left'}`}>
                 TRADING CO.
               </span>
            </div>
          </Link>
          <div className="hidden lg:flex items-center gap-8 font-bold text-sm z-10">
            <Link href="#about" className={`hover:text-blue-500 transition ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{c.nav.about}</Link>
            <Link href="#services" className={`hover:text-blue-500 transition ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{c.nav.services}</Link>
            <Link href="#why-us" className={`hover:text-blue-500 transition ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{c.nav.whyUs}</Link>
            <Link href="#projects" className={`hover:text-blue-500 transition ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{c.nav.projects}</Link>
            <Link href="#contact" className={`hover:text-blue-500 transition ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{c.nav.contact}</Link>
          </div>
          <div className="flex items-center gap-3 z-10">
            <button onClick={toggleTheme} className={`p-3 rounded-full transition-all duration-300 ${isDark ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="relative">
              <button onClick={() => setIsLangOpen(!isLangOpen)} className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                <Globe className="w-3 h-3"/> <span className="hidden sm:inline">{c.nav.currentLang}</span> <ChevronDown className="w-3 h-3"/>
              </button>
              <AnimatePresence>
                {isLangOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={`absolute top-full mt-2 w-32 rounded-xl shadow-xl border overflow-hidden p-1 z-50 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} ${isRTL ? 'left-0' : 'right-0'}`}>
                    {['ar', 'en', 'ur'].map((l) => (
                      <button key={l} onClick={() => { setLang(l as any); setIsLangOpen(false); }} className={`w-full text-start px-4 py-2.5 rounded-lg text-xs font-bold transition-colors ${lang === l ? 'bg-blue-600 text-white' : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50'}`}>
                        {l === 'ar' ? 'العربية' : l === 'en' ? 'English' : 'اردو'}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link href="/login" className={`hidden md:flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-xs transition-all shadow-lg ${isDark ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
  <LayoutDashboard size={16} /> <span className="hidden xl:inline">{c.nav.portal}</span>
</Link>
          </div>
        </div>
      </motion.nav>

      {/* --- Hero Section --- */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-6 relative grid lg:grid-cols-2 gap-16 items-center h-full w-full">
          <div className="text-center lg:text-start pt-10 hover:z-20 relative">
            <FadeIn>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8 backdrop-blur-md shadow-sm ${isDark ? 'bg-blue-900/20 border-blue-800/50 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                <Activity size={14} className="animate-pulse" />
                <span className="text-[10px] font-black tracking-widest uppercase">{c.hero.badge}</span>
              </div>
            </FadeIn>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className={`text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-6 leading-[1.2] ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {c.hero.title1}
            </motion.h1>
            <FadeIn delay={0.4}>
              <p className={`text-base md:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-10 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {c.hero.desc}
              </p>
            </FadeIn>
            <FadeIn delay={0.6}>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start hover:z-20 relative">
                <Link href="#projects" className={`group w-full sm:w-auto px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-xl hover:-translate-y-1 ${isDark ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/20' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30'}`}>
                  <Briefcase size={18} /> {c.hero.cta1}
                </Link>
                <Link href="#contact" className={`group w-full sm:w-auto px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 backdrop-blur-md border hover:-translate-y-1 ${isDark ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-800 hover:shadow-md'}`}>
                  <Phone size={18} /> {c.hero.cta2}
                </Link>
              </div>
            </FadeIn>
          </div>

          {/* 🖼️ صورة تعبيرية عن الـ CNC والحديد */}
          <motion.div
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className="flex items-center justify-center lg:justify-end relative group h-full z-10 hover:z-20"
          >
            <div className={`absolute w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px] opacity-30 ${isDark ? 'bg-blue-600' : 'bg-blue-300'} z-0`}></div>
            {/* أيقونة جمالية ضخمة ترمز لقص الليزر حتى يتم توفير صورة الماكينة الحقيقية */}
            <div className="relative z-10 p-10 border-4 border-dashed border-blue-500/30 rounded-full animate-[spin_60s_linear_infinite]">
                 <Scissors size={200} className={`transform -rotate-45 ${isDark ? 'text-blue-400/80' : 'text-blue-600/80'}`} />
            </div>
          </motion.div>
        </div>
      </section>

      <div className="relative z-10">
          
          {/* --- About Section --- */}
          <section id="about" className={`py-24 relative ${isDark ? 'bg-slate-900' : 'bg-white'} border-y ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="max-w-7xl mx-auto px-6 relative z-10">
              <FadeIn>
                <div className="text-center mb-16">
                  <h2 className={`text-3xl md:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.about.title}</h2>
                  <p className={`text-lg font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{c.about.subtitle}</p>
                </div>
              </FadeIn>
              <div className="grid md:grid-cols-3 gap-8 relative z-10">
                <FadeIn delay={0.1} direction="up">
                    <SpotlightCard isDark={isDark} className="p-8 h-full z-10 relative">
                        <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 z-10 relative"><Eye size={28}/></div>
                        <h3 className={`text-xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'} z-10 relative`}>{c.about.vision.title}</h3>
                        <p className={`text-sm leading-loose font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'} z-10 relative`}>{c.about.vision.text}</p>
                    </SpotlightCard>
                </FadeIn>
                <FadeIn delay={0.3} direction="up">
                    <SpotlightCard isDark={isDark} className="p-8 h-full border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.15)] z-10 relative transform md:-translate-y-4">
                        <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 z-10 relative"><Target size={28}/></div>
                        <h3 className={`text-xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'} z-10 relative`}>{c.about.mission.title}</h3>
                        <p className={`text-sm leading-loose font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'} z-10 relative`}>{c.about.mission.text}</p>
                    </SpotlightCard>
                </FadeIn>
                <FadeIn delay={0.5} direction="up">
                    <SpotlightCard isDark={isDark} className="p-8 h-full z-10 relative">
                        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 z-10 relative"><Crosshair size={28}/></div>
                        <h3 className={`text-xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'} z-10 relative`}>{c.about.goals.title}</h3>
                        <p className={`text-sm leading-loose font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'} z-10 relative`}>{c.about.goals.text}</p>
                    </SpotlightCard>
                </FadeIn>
              </div>
            </div>
          </section>

          {/* --- 🚀 Interactive Services Section --- */}
          <section id="services" className={`py-32 relative ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <div className="max-w-7xl mx-auto px-6 relative z-10">
              <FadeIn>
                <h2 className={`text-3xl md:text-5xl font-black text-center mb-20 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {c.services.title}
                </h2>
              </FadeIn>
              <div className="grid md:grid-cols-3 gap-8 relative z-10">
                {c.services.items.map((item, i) => (
                  <FadeIn key={i} delay={i * 0.2}>
                    <SpotlightCard isDark={isDark} className="h-full z-10 relative cursor-pointer group" >
                      <div onClick={() => setSelectedService(item)} className="p-8 h-full flex flex-col relative z-10">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-colors ${isDark ? 'bg-slate-800 text-blue-400 group-hover:bg-blue-600 group-hover:text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'} z-10 relative`}>
                          <item.icon size={32} />
                        </div>
                        <h3 className={`text-xl font-bold mb-4 transition-colors ${isDark ? 'text-white group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'} z-10 relative`}>
                          {item.title}
                        </h3>
                        <p className={`text-sm leading-relaxed mb-8 flex-1 ${isDark ? 'text-slate-400' : 'text-slate-500'} z-10 relative`}>
                          {item.shortDesc}
                        </p>
                        <div className={`text-xs font-bold flex items-center gap-2 transition-colors ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                            {isRTL ? 'عرض التفاصيل' : 'View Details'} <ArrowLeft className={`w-4 h-4 ${isRTL ? '' : 'rotate-180'} transition-transform group-hover:-translate-x-2 rtl:group-hover:translate-x-2`}/>
                        </div>
                      </div>
                    </SpotlightCard>
                  </FadeIn>
                ))}
              </div>
            </div>
          </section>

          {/* 🚀 Services Modal */}
          <AnimatePresence>
              {selectedService && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                      <motion.div 
                          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                          className={`w-full max-w-3xl max-h-[85vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}
                      >
                          <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
                              <h3 className={`text-2xl font-black flex items-center gap-3 ${textMain}`}>
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}><selectedService.icon size={20}/></div>
                                  {selectedService.title}
                              </h3>
                              <button onClick={() => setSelectedService(null)} className="p-2 rounded-full hover:bg-red-50 hover:text-red-500 transition"><X size={24}/></button>
                          </div>
                          <div className="p-8 overflow-y-auto custom-scrollbar">
                              <p className={`text-sm md:text-base leading-relaxed font-medium mb-8 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{selectedService.fullDesc}</p>
                              <div className="space-y-4">
                                  {selectedService.bullets.map((bullet: string, idx: number) => (
                                      <div key={idx} className={`p-4 rounded-xl flex items-start gap-3 border ${isDark ? 'bg-slate-800/50 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                                          <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5"/>
                                          <span className="text-sm font-bold leading-relaxed">{bullet}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </motion.div>
                  </div>
              )}
          </AnimatePresence>

          {/* --- 🚀 Why Choose Us Section --- */}
          <section id="why-us" className={`py-24 relative ${isDark ? 'bg-slate-900' : 'bg-white'} border-y ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="max-w-7xl mx-auto px-6">
                  <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
                      <FadeIn direction="right">
                          <span className={`text-xs font-bold uppercase tracking-widest mb-4 block ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Why Choose Us</span>
                          <h2 className={`text-3xl md:text-5xl font-black mb-6 leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.whyUs.subtitle}</h2>
                          <p className={`text-lg font-medium leading-relaxed mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{c.whyUs.commitmentText}</p>
                      </FadeIn>
                      <FadeIn direction="left">
                          <div className="grid grid-cols-2 gap-4">
                              {c.whyUs.stats.map((stat, i) => (
                                  <div key={i} className={`p-6 rounded-3xl text-center border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                      <div className={`text-4xl font-black font-mono mb-2 ${isDark ? 'text-blue-400' : 'text-slate-900'}`}>{stat.num}</div>
                                      <div className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</div>
                                  </div>
                              ))}
                          </div>
                      </FadeIn>
                  </div>

                  <div className="grid md:grid-cols-3 gap-8">
                      {c.whyUs.pillars.map((pillar, i) => (
                          <FadeIn key={i} delay={i * 0.2}>
                              <div className={`p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                                  <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mb-6"><pillar.icon size={28}/></div>
                                  <h3 className={`text-xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{pillar.title}</h3>
                                  <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{pillar.desc}</p>
                              </div>
                          </FadeIn>
                      ))}
                  </div>
              </div>
          </section>

          {/* --- Projects Section --- */}
          <section id="projects" className={`py-32 relative overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <div className="max-w-7xl mx-auto px-6 relative z-10">
              <FadeIn>
                <div className="text-center mb-20 relative z-10">
                  <span className={`text-xs font-bold uppercase tracking-widest mb-4 block ${isDark ? 'text-blue-400' : 'text-blue-600'} relative z-10`}>Portfolio</span>
                  <h2 className={`text-3xl md:text-5xl font-black ${isDark ? 'text-white' : 'text-slate-900'} relative z-10`}>
                    {c.projects.title}
                  </h2>
                  <p className={`mt-4 text-xl ${isDark ? 'text-slate-400' : 'text-slate-500'} relative z-10`}>{c.projects.subtitle}</p>
                </div>
              </FadeIn>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10 hover:z-20">
                {c.projects.items.map((proj, i) => (
                  <FadeIn key={i} delay={i * 0.1}>
                    <div className={`group relative h-[450px] rounded-[2.5rem] overflow-hidden border cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-100'} z-10 hover:z-30`}>
                      <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 z-0" style={{ backgroundImage: `url('${proj.image}')` }}></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-300 z-10"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-8 z-20 transition-transform duration-500 transform group-hover:-translate-y-full">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-bold px-3 py-1 rounded-lg bg-blue-600 text-white shadow-md">{proj.cat}</span>
                          <span className="text-[10px] font-bold text-white flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg"><MapPin size={12}/> {proj.loc}</span>
                        </div>
                        <h3 className="text-2xl font-black text-white leading-tight">{proj.name}</h3>
                      </div>
                      <div className="absolute -bottom-full left-0 right-0 h-full p-8 z-30 bg-slate-900/90 backdrop-blur-xl transition-transform duration-500 transform group-hover:translate-y-0 flex flex-col justify-center">
                          <h3 className="text-2xl font-black text-white mb-4 border-b border-white/10 pb-4">{proj.name}</h3>
                          <p className="text-sm font-medium text-slate-300 leading-relaxed mb-6">{proj.desc}</p>
                          <div className="grid grid-cols-2 gap-4 mt-auto">
                              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Clock size={12}/> {isRTL ? 'المدة' : 'Duration'}</div>
                                  <div className="font-bold text-white text-sm">{proj.duration}</div>
                              </div>
                              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Users size={12}/> {isRTL ? 'الفرق' : 'Teams'}</div>
                                  <div className="font-bold text-white text-sm">{proj.teams}</div>
                              </div>
                          </div>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </section>

          {/* --- 🚀 Success Partners --- */}
          <section className={`py-20 border-y ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="max-w-7xl mx-auto px-6 text-center">
                  <FadeIn>
                      <h3 className={`text-sm font-black uppercase tracking-widest mb-10 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{c.partners.title}</h3>
                      <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-70">
                          {/* 👈 أضف صور شركاء النجاح الخاصة بالورشة هنا */}
                          <img src="/partner1.png" alt="Partner 1" className="h-16 md:h-20 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 hover:scale-105" />
                          <img src="/partner2.png" alt="Partner 2" className="h-16 md:h-20 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 hover:scale-105" />
                      </div>
                  </FadeIn>
              </div>
          </section>

          {/* --- Contact Section (CTA) --- */}
          <section id="contact" className={`py-24 relative ${isDark ? 'bg-blue-900/10' : 'bg-blue-50'}`}>
              <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                  <FadeIn>
                      <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-500/30 relative z-10">
                          <Phone size={32}/>
                      </div>
                      <h2 className={`text-3xl md:text-5xl font-black mb-6 ${isDark ? 'text-white' : 'text-slate-900'} relative z-10`}>{c.contact.title}</h2>
                      <p className={`text-lg mb-10 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'} relative z-10`}>{c.contact.desc}</p>
                      <div className="flex flex-col md:flex-row items-center justify-center gap-6 relative z-20 hover:z-30">
                          <a href="tel:+966000000000" className={`flex items-center gap-4 p-5 rounded-2xl border transition-all hover:-translate-y-1 shadow-sm hover:shadow-lg w-full md:w-auto ${isDark ? 'bg-slate-900 border-slate-700 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-400'} z-10 relative`}>
                              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center z-10 relative shrink-0"><Phone size={24}/></div>
                              <div className="text-start relative z-10 overflow-hidden">
                                  <div className="text-[10px] font-bold text-slate-500 mb-1 z-10 relative">{c.contact.call}</div>
                                  <div className={`font-black text-lg md:text-xl font-mono truncate ${textMain} z-10 relative`} dir="ltr">+966 XX XXX XXXX</div>
                              </div>
                          </a>
                          <a href="mailto:info@ashkal.com" className={`flex items-center gap-4 p-5 rounded-2xl border transition-all hover:-translate-y-1 shadow-sm hover:shadow-lg w-full md:w-auto ${isDark ? 'bg-slate-900 border-slate-700 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-400'} z-10 relative`}>
                              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center z-10 relative shrink-0"><Mail size={24}/></div>
                              <div className="text-start relative z-10 overflow-hidden">
                                  <div className="text-[10px] font-bold text-slate-500 mb-1 z-10 relative">{c.contact.email}</div>
                                  <div className={`font-black text-sm md:text-base font-mono truncate ${textMain} z-10 relative`}>info@ashkal.com</div>
                              </div>
                          </a>
                      </div>
                  </FadeIn>
              </div>
          </section>

          {/* --- Footer --- */}
          <footer className={`py-12 border-t ${isDark ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-100'} relative z-10`}>
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
              <div className="flex items-center gap-3 relative z-10">
                <span className={`text-lg font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>ASHKAL & MORE</span>
                <span className={`font-bold text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} z-10 relative`}>{c.footer.rights}</span>
              </div>
              
              {/* 🚀 Social Media Icons */}
              <div className="flex items-center gap-4">
                  <a href="#" className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white'}`}><Twitter size={18}/></a>
                  <a href="#" className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white'}`}><Linkedin size={18}/></a>
                  <a href="#" className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-rose-600 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-rose-600 hover:text-white'}`}><Instagram size={18}/></a>
                  <a href="#" className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-blue-800 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-blue-800 hover:text-white'}`}><Facebook size={18}/></a>
              </div>
            </div>
          </footer>
      </div>

    </div>
  );
}