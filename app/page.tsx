import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="max-w-3xl text-center space-y-8">
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
          Bem-vindo ao <span className="text-blue-600">Projeto X</span>
        </h1>
        <p className="text-xl text-slate-600">
          A plataforma definitiva para conectar Gestores Hospitalares e Profissionais de Saúde. 
          Traga segurança, compliance e agilidade para a gestão dos seus plantões.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Link 
            href="/register" 
            className="px-8 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1"
          >
            Começar Agora (Cadastro)
          </Link>
          <Link 
            href="/login" 
            className="px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-all shadow-sm"
          >
            Já tenho uma conta
          </Link>
        </div>
      </div>
    </div>
  )
}
