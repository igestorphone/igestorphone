export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Teste Funcionando!</h1>
        <p className="text-white/70 mb-8">Se você está vendo isso, o React está funcionando</p>
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-white mb-2">Status do Sistema</h2>
          <div className="space-y-2 text-sm text-white/70">
            <div>✅ React carregado</div>
            <div>✅ Tailwind CSS funcionando</div>
            <div>✅ Componentes renderizando</div>
          </div>
        </div>
      </div>
    </div>
  )
}