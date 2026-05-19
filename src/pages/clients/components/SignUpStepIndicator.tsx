interface Props {
  step: 1 | 2;
}

export function SignUpStepIndicator({ step }: Props) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"}`}>1</div>
        <span className={step >= 1 ? "font-medium text-blue-600" : "text-gray-400"}>Dados</span>
      </div>
      <div className="flex-1 h-0.5 bg-gray-200 mx-3" />
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"}`}>2</div>
        <span className={step >= 2 ? "font-medium text-blue-600" : "text-gray-400"}>Agendamento</span>
      </div>
    </div>
  );
}
