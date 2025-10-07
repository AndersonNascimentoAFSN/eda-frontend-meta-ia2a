/**
 * Gerenciador de análises ativas
 * Armazena IDs de análise no localStorage para persistência
 */

const STORAGE_KEY = 'eda_active_analyses';

interface ActiveAnalysis {
  id: string;
  filename: string;
  status: string;
  startedAt: string;
}

export class AnalysisManager {
  /**
   * Adiciona uma nova análise ativa
   */
  static addAnalysis(id: string, filename: string, status: string): void {
    const analyses = this.getActiveAnalyses();
    const newAnalysis: ActiveAnalysis = {
      id,
      filename,
      status,
      startedAt: new Date().toISOString()
    };
    
    analyses.push(newAnalysis);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
  }

  /**
   * Obtém todas as análises ativas
   */
  static getActiveAnalyses(): ActiveAnalysis[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Obtém a análise mais recente
   */
  static getLatestAnalysis(): ActiveAnalysis | null {
    const analyses = this.getActiveAnalyses();
    return analyses.length > 0 ? analyses[analyses.length - 1] : null;
  }

  /**
   * Atualiza o status de uma análise
   */
  static updateAnalysisStatus(id: string, status: string): void {
    const analyses = this.getActiveAnalyses();
    const index = analyses.findIndex(a => a.id === id);
    
    if (index !== -1) {
      analyses[index].status = status;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
    }
  }

  /**
   * Remove análises antigas (mais de 1 dia)
   */
  static cleanupOldAnalyses(): void {
    const analyses = this.getActiveAnalyses();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const filtered = analyses.filter(a => new Date(a.startedAt) > oneDayAgo);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
}