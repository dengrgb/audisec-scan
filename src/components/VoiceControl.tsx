import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceControlProps {
  onUrlReceived: (url: string) => void;
}

export const VoiceControl = ({ onUrlReceived }: VoiceControlProps) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setIsListening(true);
        toast({
          title: "Voice Recognition Active",
          description: "Speak a URL to scan (e.g., 'https example dot com')",
        });
      };

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        
        // Process the transcript to convert spoken URL to actual URL
        let processedUrl = transcript
          .replace(/\s+/g, '')
          .replace(/dot/g, '.')
          .replace(/slash/g, '/')
          .replace(/colon/g, ':')
          .replace(/www/g, 'www.')
          .replace(/http/g, 'http:')
          .replace(/https/g, 'https:');

        // Add protocol if missing
        if (!processedUrl.startsWith('http')) {
          processedUrl = 'https://' + processedUrl;
        }

        // Basic URL validation and cleanup
        try {
          const url = new URL(processedUrl);
          onUrlReceived(url.toString());
        } catch {
          // Try some common patterns
          const commonPatterns = [
            processedUrl,
            `https://www.${processedUrl}`,
            `https://${processedUrl}.com`,
            `https://www.${processedUrl}.com`
          ];

          let validUrl = null;
          for (const pattern of commonPatterns) {
            try {
              validUrl = new URL(pattern);
              break;
            } catch {
              continue;
            }
          }

          if (validUrl) {
            onUrlReceived(validUrl.toString());
          } else {
            toast({
              title: "Voice Recognition Error",
              description: `Could not parse URL from: "${transcript}"`,
              variant: "destructive"
            });
          }
        }
      };

      recognitionInstance.onerror = (event) => {
        setIsListening(false);
        toast({
          title: "Voice Recognition Error",
          description: event.error === 'not-allowed' 
            ? "Microphone access denied. Please allow microphone access and try again."
            : `Error: ${event.error}`,
          variant: "destructive"
        });
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [onUrlReceived, toast]);

  const toggleListening = () => {
    if (!recognition) {
      toast({
        title: "Voice Recognition Not Supported",
        description: "Your browser doesn't support speech recognition",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      // Request microphone permission first
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          recognition.start();
        })
        .catch(() => {
          toast({
            title: "Microphone Access Required",
            description: "Please allow microphone access to use voice commands",
            variant: "destructive"
          });
        });
    }
  };

  return (
    <Button
      variant="voice"
      size="icon"
      onClick={toggleListening}
      disabled={!recognition}
      title={isListening ? "Stop voice input" : "Start voice input"}
      className={isListening ? "animate-pulse" : ""}
    >
      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </Button>
  );
};