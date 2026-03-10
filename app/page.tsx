'use client';



import { useState, useEffect, useRef } from 'react';

import Link from 'next/link';

import { motion, AnimatePresence, useSpring } from 'framer-motion';

import { 

  ArrowLeft, ArrowRight, Zap, Users, 

  LayoutDashboard, Phone, Globe, Activity,

  Sun, Moon, Briefcase, MapPin, ChevronDown, Eye, Target, Crosshair, Mail, Clock,

  CheckCircle2, ShieldCheck, Timer, X, Facebook, Twitter, Instagram, Linkedin, Wrench

} from 'lucide-react';



// --- مكونات مساعدة ---



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

    window.addEventListener('mousemove', handleMouseMove);

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

        <img src="/logo1.png" alt="GMS Background" className="w-full h-full object-contain filter blur-[2px]" />

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

  const [selectedService, setSelectedService] = useState<any>(null); // State for Services Modal



  const toggleTheme = () => setIsDark(prev => !prev);

  const isRTL = lang === 'ar' || lang === 'ur';



  useEffect(() => {

    setMounted(true);

    const hour = new Date().getHours();

    if (hour >= 18 || hour < 6) setIsDark(true);

    

    const handleScroll = () => setScrolled(window.scrollY > 50);

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);

  }, []);



  const content = {

    ar: {

      nav: { services: 'الخدمات', projects: 'المشاريع', whyUs: 'لماذا نحن', about: 'هويتنا', contact: 'تواصل معنا', portal: 'بوابة الموظفين', currentLang: 'العربية' },

      hero: {

        badge: 'الكهرباء - الاتصالات - المقاولات العامة',

        title1: 'شركة GMS للدعم والخدمات الفنية ',

        desc: 'شركة GMS للخدمات الفنية هي شركة مقاولات تقنية متخصصة في مجالات الكهرباء والاتصالات والمقاولات العامة, نعمل بعقلية احترافية تضع الأنظمة والسلامة وجودة التنفيذ في مقدمة الأولويات بعيدا عن الحلول السريعة أو المختصرة, يتم تنفيذ أعمالنا وفق أسس منظمة ومتوافقة مع المعايير بما يضمن الاعتمادية والاستدامة على المدى الطويل نقدم خدماتنا للقطاعات السكنية والتجارية والصناعية لعملاء يبحثون عن تنفيذ تقني موثوق وتواصل واضح ومستوى عالٍ من المسؤولية في جميع مراحل المشروع.',

        cta1: 'مشاريعنا الاستراتيجية', cta2: 'تواصل معنا',

      },

      about: {

        title: 'هويتنا ومبادئنا', subtitle: 'نبني أساسات المستقبل بخبرة واحترافية',

        vision: { title: 'الرؤية', text: 'أن تكون GMS Technical Services شركة رائدة في تقديم الحلول التقنية والمقاولات المتكاملة في مجالات الكهرباء والاتصالات والبنية التحتية، من خلال تنفيذ مشاريع موثوقة وفق أعلى معايير الجودة والسلامة.' },

        mission: { title: 'الرسالة', text: 'تقديم خدمات تقنية ومقاولات احترافية تعتمد على التنظيم والدقة والالتزام بالمعايير، مع ضمان تنفيذ موثوق وتواصل واضح يحقق قيمة حقيقية للعملاء في المشاريع السكنية والتجارية والصناعية.' },

        goals: { title: 'الأهداف', text: 'تنفيذ المشاريع بكفاءة وجودة عالية وفق الأنظمة، بناء علاقات طويلة المدى مع العملاء، تقديم حلول تقنية حديثة تدعم البنية التحتية، والحفاظ على أعلى مستويات السلامة.' }

      },

      services: {

        title: 'حلول متكاملة للبنية التحتية',

        items: [

          { 

            title: 'الخدمات الكهربائية', shortDesc: 'حلول كهربائية متكاملة وأنظمة سلامة معتمدة ⚡', icon: Zap,

            fullDesc: 'تقدم شركة GMS Technical Services حلوًلا كهربائية متكاملة تشمل المشاريع الجديدة وأعمال التحسين والتطوير إضافة إلى الصيانة المستمرة. يتم تنفيذ جميع الأعمال وفق معايير الجهات المختصة وأنظمة السلامة المعتمدة بما يشمل حساب الأحمال الكهربائية وأنظمة التأريض وحماية الدوائر الكهربائية والتوثيق الفني الكامل لضمان تشغيل آمن وموثوق على المدى الطويل.',

            bullets: [

              'تمديد وإعادة تمديد الأسلاك الكهربائية للمشاريع السكنية والتجارية والصناعية',

              'تركيب وتحديث لوحات التوزيع الرئيسية (DB) مع التنظيم ووضع الملصقات التعريفية',

              'تقييم الأحمال الكهربائية وتحسين استهلاك الطاقة لمنع الأحمال الزائدة والتوقفات',

              'أنظمة الإضاءة الداخلية والخارجية والمعمارية والصناعية',

              'تركيب مخارج الكهرباء والمفاتيح ولوحات التحكم',

              'تنفيذ أنظمة التأريض والربط الأرضي لضمان السلامة وكفاءة الأداء',

              'كشف الأعطال الكهربائية ومعالجتها',

              'توفير عقود صيانة كهربائية سنوية للمرافق والمباني'

            ]

          },

          { 

            title: 'خدمات الاتصالات', shortDesc: 'بنية تحتية للاتصالات وأنظمة شبكات ذكية 🔌', icon: Globe,

            fullDesc: 'تقدم شركة GMS Technical Services حلول اتصالات منظمة ومتكاملة تلبي متطلبات الاتصال الحديثة، مع التركيز على الأداء المستقر على المدى الطويل وتقليل التداخل وبناء بنية تحتية نظيفة ومنظمة تضمن كفاءة التشغيل وسهولة الإدارة والتوسع مستقبلاً.',

            bullets: [

              'أنظمة الكوابل المنظمة (CAT6 و CAT6A مع جاهزية للألياف البصرية)',

              'تركيب نقاط الشبكة وإنهاء التوصيلات (Network Termination)',

              'تركيب رفوف الشبكات والكبائن (Data Racks & Cabinets)',

              'أنظمة الهاتف والإنتركم',

              'تمديدات البنية التحتية لكاميرات المراقبة (CCTV)',

              'تمديدات وتركيب نقاط الواي فاي (Wi-Fi Access Points)',

              'اختبار نقاط الشبكة وترقيمها وتوثيقها لضمان التنظيم وسهولة الصيانة'

            ]

          },

          { 

            title: 'المقاولات العامة', shortDesc: 'تنسيق وتنفيذ مشاريع متكاملة باحترافية 🏗️', icon: Wrench,

            fullDesc: 'تعمل شركة GMS Technical Services كمقاول عام موثوق للمشاريع التي تتطلب تنسيًقا بين عدة تخصصات وأعمال مختلفة، حيث نحرص على الالتزام بالجداول الزمنية وضمان جودة المواد ودقة التنفيذ الفني بما يتوافق مع أهداف المشروع ومتطلباته.',

            bullets: [

              'أعمال التشطيبات للمشاريع السكنية والتجارية',

              'تعديل وتجهيز المكاتب والمتاجر والمستودعات',

              'أعمال الجبس بورد والقواطع والأسقف المستعارة',

              'الإشراف على أعمال الأرضيات والبلاط والتشطيبات',

              'دعم وتنسيق أعمال الأنظمة الميكانيكية والكهربائية والصحية (MEP)',

              'تجهيز المواقع والإشراف الفني على التنفيذ',

              'تنفيذ الأعمال المدنية والإنشائية البسيطة الداعمة للمشروع'

            ]

          },

        ]

      },

      whyUs: {

        title: 'لماذا تختار GMS؟',

        subtitle: 'الدقة في حفظ السجلات والالتزام التام بالوقت',

        commitmentTitle: 'الالتزام بالجودة والسلامة',

        commitmentText: 'يتم بناء الجودة والسلامة في كل مشروع من خلال التخطيط، استخدام المواد المعتمدة، الفنيين المدربين، والتنفيذ الموثق. تعطي GMS Technical Services الأولوية لمنع المخاطر، موثوقية الأنظمة، والمسؤولية المهنية.',

        stats: [

            { num: '+1', label: 'سنوات خبرة' }, { num: '+20', label: 'مشروع ناجح' },

            { num: '100%', label: 'التزام بالسلامة' }, { num: '100%', label: 'معدل رضا العملاء' }

        ],

        pillars: [

            { title: 'دائماً في الموعد', desc: 'تواصل واضح وجداول زمنية واقعية. نركز دائماً على الجودة وإدارة الوقت.', icon: Clock },

            { title: 'عمل جاد ومتقن', desc: 'الامتثال لمعايير السلامة والسلطات. تقديم عمل مخصص وعالي الجودة.', icon: ShieldCheck },

            { title: 'متاحون 24/7', desc: 'استجابة سريعة وحلول طويلة المدى للمشاكل على مدار الساعة.', icon: Timer }

        ]

      },

      projects: {

        title: 'أعمالنا ومشاريعنا', subtitle: 'لمحة عن المشاريع التي تفخر GMS بوضع بصمتها فيها',

        items: [

          { name: 'مشروع تطوير البنية التحتية', cat: 'طاقة ومقاولات', loc: 'المنطقة الغربية', status: 'مكتمل', duration: '18 شهر', teams: '4 فرق متخصصة', desc: 'تم تنفيذ تمديدات شبكات الجهد العالي وفق أعلى معايير السلامة العالمية.', image: '/pic1.png' },

          { name: 'تحديث شبكات الاتصالات', cat: 'اتصالات', loc: 'الرياض', status: 'قيد التنفيذ', duration: 'جاري العمل', teams: 'فريقين هندسيين', desc: 'إحلال وتجديد مسارات الألياف الضوئية وربط المحطات الرئيسية.', image: '/pic2.png' },

          { name: 'صيانة المحطات الرئيسية', cat: 'عقود تشغيل', loc: 'الجبيل الصناعية', status: 'مستمر', duration: 'عقد سنوي', teams: 'فرق طوارئ', desc: 'تقديم خدمات الصيانة الوقائية والتشغيلية على مدار الساعة لضمان استمرارية الطاقة.', image: '/pic3.png' },

        ]

      },

      partners: { title: 'شركاء النجاح' },

      contact: { title: 'نحن هنا لخدمتك', desc: 'سواء كنت تبحث عن استشارة هندسية أو تنفيذ مشروع متكامل، فريقنا جاهز للرد على استفساراتك.', call: 'المبيعات والدعم:', email: 'البريد الإلكتروني:' },

      footer: { rights: '© 2026 GMS Technical Services. جميع الحقوق محفوظة.' }

    },

    en: {

      nav: { services: 'Services', projects: 'Projects', whyUs: 'Why Us', about: 'About', contact: 'Contact', portal: 'Portal', currentLang: 'English' },

      hero: { badge: 'Electricity - Telecom - General Contracting', title1: 'GMS Technical Services & Support', desc: 'GMS Technical Services is a tech-contracting company specializing in electricity, telecom, and general contracting. We work with a professional mindset prioritizing systems, safety, and execution quality over quick fixes. Our work is executed based on organized foundations and compliant with standards to ensure long-term reliability and sustainability for residential, commercial, and industrial sectors.', cta1: 'Our Projects', cta2: 'Contact Us' },

      about: { title: 'Our Identity & Principles', subtitle: 'Building foundations of the future with expertise', vision: { title: 'Vision', text: 'To be a leading company providing technical solutions and integrated contracting in electricity, telecom, and infrastructure by executing reliable projects.' }, mission: { title: 'Mission', text: 'Providing professional technical and contracting services based on organization, accuracy, and standards adherence, ensuring reliable execution and clear communication.' }, goals: { title: 'Goals', text: 'Executing projects efficiently, building long-term client relationships, providing modern technical solutions, and maintaining the highest levels of safety.' } },

      services: {

        title: 'Integrated Infrastructure Solutions',

        items: [

          { title: 'Electrical Services', shortDesc: 'Complete electrical solutions & approved safety systems ⚡', icon: Zap, fullDesc: 'GMS Technical Services offers integrated electrical solutions including new projects, upgrades, and continuous maintenance. All work complies with authority standards and safety regulations, including load calculations, grounding, circuit protection, and full technical documentation.', bullets: ['Wiring and rewiring for residential, commercial, and industrial projects', 'Installing and upgrading main Distribution Boards (DB)', 'Electrical load assessment and power consumption optimization', 'Indoor, outdoor, architectural, and industrial lighting systems', 'Installing electrical outlets, switches, and control panels', 'Executing grounding and earthing systems for safety and efficiency', 'Detecting and resolving electrical faults', 'Providing annual electrical maintenance contracts'] },

          { title: 'Telecom Services', shortDesc: 'Telecom infrastructure & smart network systems 🔌', icon: Globe, fullDesc: 'GMS Technical Services provides organized telecom solutions meeting modern communication needs, focusing on long-term stable performance, minimizing interference, and building clean infrastructure for operational efficiency and future scalability.', bullets: ['Structured cabling systems (CAT6 & CAT6A with Fiber Optic readiness)', 'Network point installation and termination', 'Installing Data Racks & Cabinets', 'Telephone and Intercom systems', 'Infrastructure wiring for CCTV', 'Installing Wi-Fi Access Points', 'Testing, numbering, and documenting network points for easy maintenance'] },

          { title: 'General Contracting', shortDesc: 'Executing integrated projects with professionalism 🏗️', icon: Wrench, fullDesc: 'GMS Technical Services acts as a reliable general contractor for projects requiring coordination between multiple disciplines, adhering to timelines and ensuring material quality and precise technical execution aligned with project goals.', bullets: ['Finishing works for residential and commercial projects', 'Modifying and preparing offices, stores, and warehouses', 'Gypsum board, partitions, and suspended ceilings works', 'Supervising flooring, tiling, and finishing works', 'Supporting and coordinating MEP systems', 'Site preparation and technical execution supervision', 'Executing simple civil and structural works supporting the project'] }

        ]

      },

      whyUs: { title: 'Why Choose GMS?', subtitle: 'Accurate Record Keeping and Always On Time', commitmentTitle: 'Commitment To Quality & Safety', commitmentText: 'Quality and safety are built into every project through planning, approved materials, trained technicians, and documented execution. GMS prioritizes risk prevention, system reliability, and professional accountability.', stats: [{ num: '8+', label: 'Years Experience' }, { num: '140+', label: 'Projects Completed' }, { num: '100%', label: 'Safety Compliant' }, { num: '95%', label: 'Client Retention' }], pillars: [{ title: 'Always On Time', desc: 'Clear communication and realistic timelines. Always focused on quality.', icon: Clock }, { title: 'Hard Working', desc: 'Compliance with safety standards. Delivering high quality work.', icon: ShieldCheck }, { title: '24/7 Availability', desc: 'Long-term reliability over short-term fixes. Fast 24/7 response.', icon: Timer }] },

      projects: { title: 'Our Portfolio', subtitle: 'A glimpse of the projects GMS is proud to execute', items: [{ name: 'Infrastructure Dev Project', cat: 'Power & Contracting', loc: 'Western Region', status: 'Completed', duration: '18 Months', teams: '4 Spec. Teams', desc: 'Executed HV network cabling according to international safety standards.', image: '/pic1.png' }, { name: 'Telecom Network Upgrade', cat: 'Telecom', loc: 'Riyadh', status: 'Ongoing', duration: 'In Progress', teams: '2 Eng. Teams', desc: 'Replacing fiber optic routes and connecting main substations.', image: '/pic2.png' }, { name: 'Main Substation Maintenance', cat: 'O&M Contracts', loc: 'Jubail Industrial', status: 'Continuous', duration: 'Annual Contract', teams: 'Emergency Teams', desc: 'Providing 24/7 preventative and operational maintenance services.', image: '/pic3.png' }] },

      partners: { title: 'Our Success Partners' },

      contact: { title: 'We are here to serve you', desc: 'Whether you need engineering consultation or full project execution, our team is ready.', call: 'Sales & Support:', email: 'Email:' },

      footer: { rights: '© 2026 GMS Technical Services. All rights reserved.' }

    },

    ur: {

      nav: { services: 'خدمات', projects: 'منصوبے', whyUs: 'ہم کیوں', about: 'ہمارے بارے میں', contact: 'رابطہ کریں', portal: 'پورٹل', currentLang: 'اردو' },

      hero: { badge: 'بجلی - ٹیلی کام - جنرل کنٹریکٹنگ', title1: 'GMS ٹیکنیکل سروسز', desc: 'GMS ٹیکنیکل سروسز ایک ٹیک کنٹریکٹنگ کمپنی ہے جو بجلی، ٹیلی کام، اور جنرل کنٹریکٹنگ میں مہارت رکھتی ہے۔ ہم ایک پیشہ ورانہ ذہنیت کے ساتھ کام کرتے ہیں۔', cta1: 'ہمارے منصوبے', cta2: 'رابطہ کریں' },

      about: { title: 'ہماری شناخت اور اصول', subtitle: 'مہارت کے ساتھ مستقبل کی بنیادیں بنانا', vision: { title: 'نقطہ نظر', text: 'ایک سرکردہ کمپنی بننا۔' }, mission: { title: 'مشن', text: 'پیشہ ورانہ تکنیکی خدمات فراہم کرنا۔' }, goals: { title: 'مقاصد', text: 'منصوبوں کو مؤثر طریقے سے انجام دینا۔' } },

      services: { title: 'بنیادی ڈھانچے کے حل', items: [{ title: 'الیکٹریکل سروسز', shortDesc: 'مکمل برقی حل ⚡', icon: Zap, fullDesc: 'الیکٹریکل نیٹ ورکس کی تنصیب اور ترقی۔', bullets: ['وائرنگ', 'پینل بورڈز', 'لائٹنگ'] }, { title: 'ٹیلی کام سروسز', shortDesc: 'اسمارٹ نیٹ ورک سسٹمز 🔌', icon: Globe, fullDesc: 'ٹیلی کام انفراسٹرکچر کا انتظام۔', bullets: ['نیٹ ورک کیبلنگ', 'CCTV', 'Wi-Fi'] }, { title: 'جنرل کنٹریکٹنگ', shortDesc: 'پروجیکٹ کا انتظام 🏗️', icon: Wrench, fullDesc: 'قابل اعتماد جنرل کنٹریکٹر۔', bullets: ['تزئین و آرائش', 'دفتر کی تیاری'] }] },

      whyUs: { title: 'GMS کیوں؟', subtitle: 'درست ریکارڈ اور وقت کی پابندی', commitmentTitle: 'معیار اور حفاظت سے وابستگی', commitmentText: 'ہر پروجیکٹ میں معیار کو یقینی بنایا جاتا ہے۔', stats: [{ num: '8+', label: 'سال کا تجربہ' }, { num: '140+', label: 'مکمل منصوبے' }, { num: '100%', label: 'حفاظت' }, { num: '95%', label: 'کلائنٹ کی برقراری' }], pillars: [{ title: 'وقت پر', desc: 'ہمیشہ وقت پر کام کی تکمیل', icon: Clock }, { title: 'محنت کش', desc: 'اعلی معیار کا کام', icon: ShieldCheck }, { title: '24/7 دستیابی', desc: 'ہر وقت مدد کے لیے تیار', icon: Timer }] },

      projects: { title: 'ہمارے منصوبے', subtitle: 'ان منصوبوں کی ایک جھلک جن پر GMS کو فخر ہے', items: [{ name: 'انفراسٹرکچر ڈیولپمنٹ', cat: 'پاور کنٹریکٹنگ', loc: 'مغربی علاقہ', status: 'مکمل', duration: '18 ماہ', teams: '4 ٹیمیں', desc: 'ایچ وی نیٹ ورک کیبلنگ کو انجام دیا۔', image: '/pic1.png' }, { name: 'ٹیلی کام نیٹ ورک اپ گریڈ', cat: 'ٹیلی کمیونیکیشن', loc: 'ریاض', status: 'جاری', duration: 'جاری ہے', teams: '2 ٹیمیں', desc: 'فائبر آپٹک روٹس کو تبدیل کرنا۔', image: '/pic2.png' }, { name: 'مین سب اسٹیشن مینٹیننس', cat: 'O&M معاہدے', loc: 'جبیل', status: 'مسلسل', duration: 'سالانہ معاہدہ', teams: 'ایمرجنسی ٹیمیں', desc: 'دیکھ بھال کی خدمات۔', image: '/pic3.png' }] },

      partners: { title: 'ہمارے پارٹنرز' },

      contact: { title: 'ہم آپ کی خدمت کے لیے حاضر ہیں', desc: 'ہماری ٹیم آپ کے سوالات کے جواب دینے کے لیے تیار ہے۔', call: 'کال کریں:', email: 'ای میل:' },

      footer: { rights: '© 2026 GMS Technical Services. جملہ حقوق محفوظ ہیں۔' }

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

        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'h-20 bg-opacity-90 backdrop-blur-xl border-b shadow-sm' : 'h-28 bg-transparent border-transparent'} ${isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-white/80'}`}

      >

        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">

          <Link href="/" className="flex items-center gap-4 group z-10">

            <img src="/logo1.png" className="h-16 md:h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-105" alt="GMS Logo" />

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

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className={`text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 leading-[1.1] ${isDark ? 'text-white' : 'text-slate-900'}`}>

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



          {/* 🖼️ صورة الفني */}

          <motion.div

            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}

            className="flex items-end justify-center lg:justify-end relative group h-full z-10 hover:z-20"

          >

            <div className={`absolute w-full h-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px] opacity-30 ${isDark ? 'bg-blue-600' : 'bg-blue-300'} z-0`}></div>

            <div className="relative z-10 transition-transform duration-500 group-hover:scale-105 [mask-image:linear-gradient(to_bottom,black_80%,transparent_100%)] -mb-1 tracking-normal leading-none flex items-end block">

              <img src="/technician.png" alt="GMS Expert Technician" className="w-full max-w-[350px] md:max-w-[450px] lg:max-w-[550px] h-auto object-contain drop-shadow-[0_35px_35px_rgba(59,130,246,0.2)] block" />

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

                          <span className={`text-xs font-bold uppercase tracking-widest mb-4 block ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Why Choose Me</span>

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

                          {/* 👈 أضف صور شركاء النجاح هنا وضعها في مجلد public */}

                          <img src="/haif.png" alt="Haif Company" className="h-16 md:h-20 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 hover:scale-105" />

                          <img src="/sec.png" alt="Saudi Electricity Company" className="h-16 md:h-20 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 hover:scale-105" />

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

                          <a href="tel:+966574253172" className={`flex items-center gap-4 p-5 rounded-2xl border transition-all hover:-translate-y-1 shadow-sm hover:shadow-lg w-full md:w-auto ${isDark ? 'bg-slate-900 border-slate-700 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-400'} z-10 relative`}>

                              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center z-10 relative shrink-0"><Phone size={24}/></div>

                              <div className="text-start relative z-10 overflow-hidden">

                                  <div className="text-[10px] font-bold text-slate-500 mb-1 z-10 relative">{c.contact.call}</div>

                                  <div className={`font-black text-lg md:text-xl font-mono truncate ${textMain} z-10 relative`} dir="ltr">+966 57 425 3172</div>

                              </div>

                          </a>

                          <a href="mailto:gm@gmstechnicalservices.com" className={`flex items-center gap-4 p-5 rounded-2xl border transition-all hover:-translate-y-1 shadow-sm hover:shadow-lg w-full md:w-auto ${isDark ? 'bg-slate-900 border-slate-700 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-400'} z-10 relative`}>

                              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center z-10 relative shrink-0"><Mail size={24}/></div>

                              <div className="text-start relative z-10 overflow-hidden">

                                  <div className="text-[10px] font-bold text-slate-500 mb-1 z-10 relative">{c.contact.email}</div>

                                  <div className={`font-black text-sm md:text-base font-mono truncate ${textMain} z-10 relative`}>gm@gmstechnicalservices.com</div>

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

                <img src="/logo1.png" alt="GMS" className="h-10 w-auto grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100 z-10 relative" />

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



