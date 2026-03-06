import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // إنشاء عميل Supabase خاص بالـ Middleware للتعامل مع الكوكيز
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // جلب بيانات المستخدم الحالي
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl;

  // 1. حماية المسارات الحساسة: إذا لم يكن هناك مستخدم، قم بتحويله لصفحة تسجيل الدخول
  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/manager')) && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // 2. إذا كان المستخدم مسجلاً الدخول وحاول فتح صفحة الـ login، قم بتحويله للوحة التحكم
  if (pathname.startsWith('/login') && user) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}

// تحديد المسارات التي يجب أن يمر عليها الـ Middleware
export const config = {
  matcher: [
    /*
     * تطبيق الـ Middleware على جميع المسارات باستثناء:
     * - ملفات النظام (_next/static, _next/image)
     * - أيقونة الموقع (favicon.ico)
     * - ملفات الصور (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}