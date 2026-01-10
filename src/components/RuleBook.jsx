import React from 'react';
import { X, BookOpen, Scroll } from 'lucide-react';

const RuleBook = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-cyan-500/10 p-2 rounded-lg">
                            <BookOpen className="text-cyan-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Livro de Regras</h2>
                            <p className="text-gray-400 text-sm">Guia oficial de sobrevivência na Corte</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    
                    {/* Intro */}
                    <section className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700">
                        <h3 className="text-cyan-400 font-bold uppercase tracking-widest text-sm mb-2">Objetivo</h3>
                        <p className="text-gray-300 leading-relaxed">
                            Destruir a influência de todas as outras famílias, forçando-as ao exílio. 
                            <span className="text-white font-bold"> Apenas uma família sobreviverá.</span>
                        </p>
                    </section>

                    {/* Actions Grid */}
                    <section>
                        <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-cyan-500 rounded-full"></span>
                            Ações Gerais
                        </h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                <div className="text-green-400 font-bold mb-1">Renda</div>
                                <p className="text-gray-400 text-sm">Pegue <strong className="text-white">1 moeda</strong>.</p>
                                <div className="mt-2 text-xs text-gray-500 font-mono">Imbloqueável</div>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                <div className="text-green-400 font-bold mb-1">Ajuda Externa</div>
                                <p className="text-gray-400 text-sm">Pegue <strong className="text-white">2 moedas</strong>.</p>
                                <div className="mt-2 text-xs text-orange-400 font-mono">Bloqueável pelo Duque</div>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                <div className="text-red-400 font-bold mb-1">Golpe de Estado</div>
                                <p className="text-gray-400 text-sm">Pague <strong className="text-white">7 moedas</strong>. Elimine uma influência.</p>
                                <div className="mt-2 text-xs text-gray-500 font-mono">Imbloqueável (Obrigatório com 10+ moedas)</div>
                            </div>
                        </div>
                    </section>

                    {/* Character Actions */}
                    <section>
                        <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                            Personagens
                        </h3>
                        <div className="space-y-4">
                            {/* Duke */}
                            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex gap-4">
                                <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center shrink-0 border border-purple-500/30 text-purple-400 font-bold text-xl">D</div>
                                <div>
                                    <h4 className="text-white font-bold text-lg">Duque</h4>
                                    <ul className="mt-2 space-y-1 text-sm text-gray-400">
                                        <li className="flex items-start gap-2"><span className="text-purple-400">►</span> <span><strong className="text-gray-200">Taxar:</strong> Pega 3 moedas do tesouro.</span></li>
                                        <li className="flex items-start gap-2"><span className="text-blue-400">🛡️</span> <span>Bloqueia <strong className="text-gray-200">Ajuda Externa</strong>.</span></li>
                                    </ul>
                                </div>
                            </div>

                            {/* Assassin */}
                            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex gap-4">
                                <div className="w-12 h-12 bg-red-900/30 rounded-lg flex items-center justify-center shrink-0 border border-red-500/30 text-red-400 font-bold text-xl">A</div>
                                <div>
                                    <h4 className="text-white font-bold text-lg">Assassino</h4>
                                    <ul className="mt-2 space-y-1 text-sm text-gray-400">
                                        <li className="flex items-start gap-2"><span className="text-red-400">►</span> <span><strong className="text-gray-200">Assassinar:</strong> Pague 3 moedas. Escolha um jogador para perder 1 influência.</span></li>
                                        <li className="text-xs text-red-500 mt-1 italic">Se for bloqueado pela Condessa, você perde as 3 moedas.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Captain */}
                            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex gap-4">
                                <div className="w-12 h-12 bg-yellow-900/30 rounded-lg flex items-center justify-center shrink-0 border border-yellow-500/30 text-yellow-500 font-bold text-xl">C</div>
                                <div>
                                    <h4 className="text-white font-bold text-lg">Capitão</h4>
                                    <ul className="mt-2 space-y-1 text-sm text-gray-400">
                                        <li className="flex items-start gap-2"><span className="text-yellow-500">►</span> <span><strong className="text-gray-200">Extorquir:</strong> Pegue 2 moedas de outro jogador.</span></li>
                                        <li className="flex items-start gap-2"><span className="text-blue-400">🛡️</span> <span>Bloqueia <strong className="text-gray-200">Extorsão</strong> de outro Capitão.</span></li>
                                    </ul>
                                </div>
                            </div>

                            {/* Ambassador */}
                            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex gap-4">
                                <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0 border border-blue-500/30 text-blue-400 font-bold text-xl">E</div>
                                <div>
                                    <h4 className="text-white font-bold text-lg">Embaixador</h4>
                                    <ul className="mt-2 space-y-1 text-sm text-gray-400">
                                        <li className="flex items-start gap-2"><span className="text-blue-400">►</span> <span><strong className="text-gray-200">Trocar:</strong> Compre 2 cartas, escolha quais manter entre as 2 compradas e as suas atuais, devolva as outras.</span></li>
                                        <li className="flex items-start gap-2"><span className="text-blue-400">🛡️</span> <span>Bloqueia <strong className="text-gray-200">Extorsão</strong>.</span></li>
                                    </ul>
                                </div>
                            </div>

                            {/* Contessa */}
                            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex gap-4">
                                <div className="w-12 h-12 bg-pink-900/30 rounded-lg flex items-center justify-center shrink-0 border border-pink-500/30 text-pink-400 font-bold text-xl">C</div>
                                <div>
                                    <h4 className="text-white font-bold text-lg">Condessa</h4>
                                    <ul className="mt-2 space-y-1 text-sm text-gray-400">
                                        <li className="flex items-start gap-2"><span className="text-pink-400">🛡️</span> <span>Bloqueia <strong className="text-gray-200">Assassinato</strong>.</span></li>
                                        <li className="text-xs text-gray-500 mt-1 italic">Não possui ação ativa, apenas defesa.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Challenges & Blocks */}
                    <section className="grid md:grid-cols-2 gap-6">
                        <div className="bg-red-900/10 p-5 rounded-xl border border-red-900/30">
                            <h3 className="text-red-400 font-bold uppercase tracking-widest text-sm mb-3">Contestações</h3>
                            <p className="text-gray-400 text-sm mb-3">
                                Qualquer jogador pode contestar um personagem declarado.
                            </p>
                            <ul className="space-y-2 text-sm">
                                <li className="text-gray-300">
                                    <strong className="text-red-400">Falha ao provar:</strong> Se o jogador não tiver o personagem (blefe), ele perde uma influência. A ação é cancelada.
                                </li>
                                <li className="text-gray-300">
                                    <strong className="text-green-400">Prova com sucesso:</strong> Se ele tiver o personagem, ele mostra, troca por uma nova carta do baralho. <strong className="text-white">QUEM CONTESTOU</strong> perde uma influência. A ação ocorre.
                                </li>
                            </ul>
                        </div>

                        <div className="bg-blue-900/10 p-5 rounded-xl border border-blue-900/30">
                            <h3 className="text-blue-400 font-bold uppercase tracking-widest text-sm mb-3">Bloqueios</h3>
                            <p className="text-gray-400 text-sm mb-3">
                                Certas ações podem ser bloqueadas por personagens específicos (e.g., Duque bloqueia Ajuda Externa).
                            </p>
                            <ul className="space-y-2 text-sm">
                                <li className="text-gray-300">
                                    Quem sofre a ação ou outros jogadores podem declarar um bloqueio.
                                </li>
                                <li className="text-gray-300">
                                    O bloqueio também pode ser contestado!
                                </li>
                            </ul>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default RuleBook;
