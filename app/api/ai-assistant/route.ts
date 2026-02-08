import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { action, lang, data } = await req.json();
    let systemPrompt = "";
    let userPrompt = JSON.stringify(data);

    // تحديد سلوك الذكاء الاصطناعي بناءً على الصفحة (Action)
    switch (action) {
      case 'analyze-assignment': // صفحة توزيع المهام
        systemPrompt = `You are an expert Operations Manager for a technical contracting company. 
        Analyze the task requirements against the employees list. 
        Recommend the best employee based on: Skill Match, Availability, and Location Proximity.
        Output language: ${lang === 'ar' ? 'Arabic' : 'English'}. Keep it concise (max 2 sentences).`;
        break;

      case 'generate-project': // صفحة إنشاء المشروع
        systemPrompt = `You are a Project Planning Expert. 
        Based on the project title provided, generate a realistic JSON object with:
        risk (Low/Medium/High), budget (estimated in SAR), equipment (array of strings), 
        team (array of mocked names with roles), startDate (YYYY-MM-DD), endDate (YYYY-MM-DD).
        Output ONLY valid JSON. No markdown.`;
        break;

      case 'analyze-progress': // صفحة متابعة الإنجاز
        systemPrompt = `You are a Risk Management Consultant. 
        Analyze the provided project list (status, delays, risk). 
        Identify the most critical issue and suggest a strategic action.
        Output language: ${lang === 'ar' ? 'Arabic' : 'English'}. Concise executive summary style.`;
        break;

      case 'optimize-resources': // صفحة الموارد
        systemPrompt = `You are a Resource Optimization Specialist. 
        Analyze the resource utilization data. Identify inefficiencies (over/under utilization) 
        and suggest an actionable optimization step.
        Output language: ${lang === 'ar' ? 'Arabic' : 'English'}.`;
        break;

      case 'validate-field-report': // صفحة التحديث الميداني
        systemPrompt = `You are a QA/QC Field Engineer Auditor.
        Validate the field report (status, notes). 
        If status is Delayed/Blocked and no reason is given, return type: 'warning'.
        If notes are too short (<5 words), return type: 'warning'.
        Otherwise return type: 'success'.
        Return JSON: { "type": "warning" | "success", "msg": "reason in ${lang === 'ar' ? 'Arabic' : 'English'}" }`;
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // أو gpt-3.5-turbo للتوفير
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    });

    const result = completion.choices[0].message.content;

    // معالجة الرد إذا كان JSON (لصفحات الإنشاء والتقرير الميداني)
    if (action === 'generate-project' || action === 'validate-field-report') {
       try {
         // تنظيف الرد من أي نصوص إضافية في حال وجدت
         const cleanJson = result?.replace(/```json|```/g, '').trim();
         return NextResponse.json({ result: JSON.parse(cleanJson || '{}') });
       } catch (e) {
         return NextResponse.json({ result }); // Fallback
       }
    }

    return NextResponse.json({ result });

  } catch (error) {
    console.error('AI Error:', error);
    return NextResponse.json({ result: 'Error connecting to AI service.' }, { status: 500 });
  }
}