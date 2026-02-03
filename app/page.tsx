import Link from 'next/link';
import { 
  ArrowRight, ShieldCheck, Zap, Users, 
  LayoutDashboard, Phone, HardHat, ChevronRight 
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-600 selection:text-white">

      {/* --- Navbar (Navigation) --- */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-black text-blue-900 tracking-tighter">
            GMS<span className="text-blue-600">Platform</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <Link href="#services" className="hover:text-blue-600 transition">Services</Link>
            <Link href="#about" className="hover:text-blue-600 transition">About Us</Link>
            <Link href="#contact" className="hover:text-blue-600 transition">Contact</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="hidden md:flex items-center gap-2 text-gray-600 hover:text-blue-900 font-semibold transition"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Employee Login</span>
            </Link>
            <Link 
              href="#quote" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg shadow-blue-200"
            >
              Request Quote
            </Link>
          </div>
        </div>
      </nav>

      {/* --- Hero Section (The Header) --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-blue-100 rounded-full blur-3xl opacity-50 -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-cyan-100 rounded-full blur-3xl opacity-50 -z-10"></div>

        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-8">
            <ShieldCheck className="w-4 h-4" /> Trusted by Industry Leaders
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8">
            Next-Gen Solutions for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
              Industrial Operations
            </span>
          </h1>

          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
            We provide world-class manpower supply, cable testing, and smart fleet management. 
            Empowering your projects with precision and technology.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="#quote" className="w-full sm:w-auto px-8 py-4 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2">
              Get a Quote Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#contact" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-gray-200 rounded-xl font-bold hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
              <Phone className="w-5 h-5" /> Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* --- Services Section (Jabar Style) --- */}
      <section id="services" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Our Premium Services</h2>
            <p className="text-slate-500">Comprehensive solutions tailored for mega-projects</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Service 1 */}
            <div className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-blue-600 hover:text-white transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-blue-500">
                <Zap className="w-8 h-8 text-blue-600 group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Cable Testing</h3>
              <p className="text-slate-500 group-hover:text-blue-100 leading-relaxed">
                High-voltage testing and diagnostics ensuring safety and compliance with international standards.
              </p>
            </div>

            {/* Service 2 */}
            <div className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-blue-600 hover:text-white transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-blue-500">
                <Users className="w-8 h-8 text-blue-600 group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Manpower Supply</h3>
              <p className="text-slate-500 group-hover:text-blue-100 leading-relaxed">
                Deploying skilled engineers, technicians, and labor to keep your operations running smoothly.
              </p>
            </div>

            {/* Service 3 */}
            <div className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-blue-600 hover:text-white transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-blue-500">
                <HardHat className="w-8 h-8 text-blue-600 group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Project Management</h3>
              <p className="text-slate-500 group-hover:text-blue-100 leading-relaxed">
                End-to-end supervision using our smart GMS Platform to track progress and assets in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA / Request Quote Section --- */}
      <section id="quote" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[100px] opacity-20"></div>
        
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to Start Your Project?</h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Get a detailed quotation within 24 hours. Our team is ready to analyze your requirements and provide the best solution.
          </p>
          
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <Link href="/contact" className="px-10 py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-lg transition-transform hover:scale-105 shadow-lg shadow-blue-900/50">
              Request Quotation
            </Link>
            <Link href="/admin" className="px-10 py-5 bg-transparent border border-gray-600 hover:bg-gray-800 rounded-2xl font-bold text-lg transition-all">
              Employee Login
            </Link>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-slate-50 py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-2xl font-black text-blue-900">
            GMS<span className="text-blue-600">Platform</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2026 GMS Platform. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-blue-600 transition">LinkedIn</a>
            <a href="#" className="text-gray-400 hover:text-blue-600 transition">Twitter</a>
            <a href="#" className="text-gray-400 hover:text-blue-600 transition">Email</a>
          </div>
        </div>
      </footer>

    </div>
  );
}