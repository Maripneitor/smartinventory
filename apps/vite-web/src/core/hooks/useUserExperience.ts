import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface UserAction {
  type: string;
  timestamp: number;
  success: boolean;
  error?: string;
}

interface UserPreference {
  preferredInput: 'camera' | 'upload' | 'text';
  lastSuccessfulMethod: string;
  tipsSeen: string[];
  errorCount: number;
}

class UserExperienceManager {
  private actions: UserAction[] = [];
  private preferences: UserPreference = {
    preferredInput: 'camera',
    lastSuccessfulMethod: '',
    tipsSeen: [],
    errorCount: 0
  };
  
  private tips = [
    '📸 Asegúrate de tener buena iluminación para mejores resultados',
    '🎯 Coloca el objeto centrado y con fondo liso',
    '🔄 Si no reconoce bien, intenta tomar la foto desde otro ángulo',
    '📝 Puedes editar los datos después del análisis automático',
    '🔍 Usa la búsqueda por texto si la cámara no funciona bien'
  ];

  recordAction(type: string, success: boolean, error?: string) {
    this.actions.push({ type, timestamp: Date.now(), success, error });
    
    if (!success) {
      this.preferences.errorCount++;
      if (this.preferences.errorCount >= 3) {
        this.showTip();
      }
    }
    
    if (success) {
      this.preferences.lastSuccessfulMethod = type;
      this.preferences.errorCount = 0;
    }
    
    if (this.actions.length > 100) this.actions = this.actions.slice(-100);
  }

  getPreferredInput(): 'camera' | 'upload' | 'text' {
    const recentCameraFails = this.actions
      .filter(a => a.type === 'camera' && !a.success)
      .slice(-3).length;
    
    if (recentCameraFails >= 2) return 'upload';
    return this.preferences.preferredInput;
  }

  showTip() {
    const unseenTips = this.tips.filter(tip => !this.preferences.tipsSeen.includes(tip));
    const tip = unseenTips[0] || this.tips[Math.floor(Math.random() * this.tips.length)];
    
    if (!this.preferences.tipsSeen.includes(tip)) {
      this.preferences.tipsSeen.push(tip);
    }
    
    toast.info('💡 Consejo', {
      description: tip,
      duration: 5000
    });
  }

  getErrorHelp(error: string): string {
    const errorMap: Record<string, string> = {
      'cámara': 'Verifica los permisos de la cámara en la configuración del navegador',
      'Imagen': 'Asegúrate de que el archivo sea una imagen JPG o PNG',
      'conexión': 'Revisa tu conexión a internet e intenta nuevamente',
      'Límite': 'Has usado muchas veces el servicio, espera unos minutos'
    };
    
    for (const [key, help] of Object.entries(errorMap)) {
      if (error.toLowerCase().includes(key.toLowerCase())) return help;
    }
    return 'Intenta con otra imagen o usa la búsqueda por texto';
  }
}

export const userExperience = new UserExperienceManager();

export function useUserExperience() {
  const [preferredInput, setPreferredInput] = useState<'camera' | 'upload' | 'text'>('camera');
  
  useEffect(() => {
    setPreferredInput(userExperience.getPreferredInput());
  }, []);
  
  const trackAction = useCallback((type: string, success: boolean, error?: string) => {
    userExperience.recordAction(type, success, error);
  }, []);
  
  const showTip = useCallback(() => {
    userExperience.showTip();
  }, []);
  
  const getErrorHelp = useCallback((error: string) => {
    return userExperience.getErrorHelp(error);
  }, []);
  
  return {
    preferredInput,
    trackAction,
    showTip,
    getErrorHelp
  };
}
