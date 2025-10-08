"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { generateQuiz, saveQuizResult, explainQuestion } from "@/actions/interview";
import QuizResult from "./quiz-result";
import { BarLoader } from "react-spinners";

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanations, setExplanations] = useState({});
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [locked, setLocked] = useState([]);
  const [quizData, setQuizData] = useState(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [savingResult, setSavingResult] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (quizData) {
      setAnswers(new Array(quizData.length).fill(null));
      setLocked(new Array(quizData.length).fill(false));
    }
  }, [quizData]);

  const handleGenerateQuiz = async () => {
    setGeneratingQuiz(true);
    try {
      const questions = await generateQuiz();
      setQuizData(questions);
    } catch (error) {
      toast.error(error.message || "Failed to generate quiz");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleAnswer = (answer) => {
    if (locked[currentQuestion]) return;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };

  const handleLock = () => {
    if (!answers[currentQuestion]) return;
    const newLocked = [...locked];
    newLocked[currentQuestion] = true;
    setLocked(newLocked);

    // Prefetch next question explanation in background
    const nextIndex = currentQuestion + 1;
    if (quizData && nextIndex < quizData.length && !explanations[nextIndex]) {
      const nextQ = quizData[nextIndex];
      explainQuestion(nextQ.question, nextQ.correctAnswer)
        .then((text) => {
          setExplanations((prev) => ({ ...prev, [nextIndex]: text }));
        })
        .catch(() => {
          // ignore prefetch errors
        });
    }
  };

  const handleNext = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowExplanation(false);
    } else {
      finishQuiz();
    }
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer === quizData[index].correctAnswer) {
        correct++;
      }
    });
    return (correct / quizData.length) * 100;
  };

  const finishQuiz = async () => {
    const score = calculateScore();
    setSavingResult(true);
    try {
      const result = await saveQuizResult(quizData, answers, score);
      setResultData(result);
      toast.success("Quiz completed!");
    } catch (error) {
      toast.error(error.message || "Failed to save quiz results");
    } finally {
      setSavingResult(false);
    }
  };

  const startNewQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowExplanation(false);
    setExplanations({});
    setQuizData(null);
    setResultData(null);
    handleGenerateQuiz();
  };

  const fetchExplanation = async () => {
    const q = quizData[currentQuestion];
    if (explanations[currentQuestion]) {
      setShowExplanation(true);
      return;
    }
    try {
      setLoadingExplanation(true);
      const text = await explainQuestion(q.question, q.correctAnswer);
      setExplanations((prev) => ({ ...prev, [currentQuestion]: text }));
      setShowExplanation(true);
    } catch (e) {
      toast.error("Failed to load explanation");
    } finally {
      setLoadingExplanation(false);
    }
  };

  // Don't render until mounted on client side
  if (!mounted) {
    return (
      <Card className="mx-2">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Preparing your quiz...</p>
        </CardContent>
      </Card>
    );
  }

  if (generatingQuiz) {
    return (
      <Card className="mx-2">
        <CardHeader>
          <CardTitle>Preparing your quiz...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Generating industry-specific questions tailored to your profile. This might take a moment.
          </p>
          <BarLoader className="mt-4" width={"100%"} color="gray" />
        </CardContent>
      </Card>
    );
  }

  // Show results if quiz is completed
  if (resultData) {
    return (
      <div className="mx-2">
        <QuizResult result={resultData} onStartNew={startNewQuiz} />
      </div>
    );
  }

  if (!quizData) {
    return (
      <Card className="mx-2">
        <CardHeader>
          <CardTitle>Ready to test your knowledge?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This quiz contains 10 questions specific to your industry and
            skills. Take your time and choose the best answer for each question.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerateQuiz} className="w-full" disabled={generatingQuiz}>
            {generatingQuiz ? "Preparing..." : "Start Quiz"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const question = quizData[currentQuestion];

  return (
    <Card className="mx-2">
      <CardHeader>
        <CardTitle>
          Question {currentQuestion + 1} of {quizData.length}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg font-medium">{question.question}</p>
        <RadioGroup
          onValueChange={handleAnswer}
          value={answers[currentQuestion]}
          className="space-y-2"
        >
          {question.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem
                value={option}
                id={`option-${index}`}
                disabled={locked[currentQuestion]}
              />
              <Label htmlFor={`option-${index}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>

        {showExplanation && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="font-medium">Explanation:</p>
            <p className="text-muted-foreground">
              {explanations[currentQuestion]}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {!locked[currentQuestion] && (
          <Button
            onClick={handleLock}
            variant="secondary"
            disabled={!answers[currentQuestion]}
          >
            Lock Answer
          </Button>
        )}

        {locked[currentQuestion] && !showExplanation && (
          <Button
            onClick={fetchExplanation}
            variant="outline"
            disabled={loadingExplanation}
          >
            {loadingExplanation ? "Loading..." : "Show Explanation"}
          </Button>
        )}

        {locked[currentQuestion] && (
          <Button
            onClick={handleNext}
            disabled={savingResult}
            className="ml-auto"
          >
            {savingResult ? "Saving..." : currentQuestion < quizData.length - 1
              ? "Next Question"
              : "Finish Quiz"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}