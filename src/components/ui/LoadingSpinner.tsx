type Props = { size?: 'sm' | 'lg' };

export function LoadingSpinner({ size = 'sm' }: Props) {
  const px = size === 'lg' ? 'w-12 h-12' : 'w-6 h-6';
  return (
    <div
      className={`${px} border-2 border-indigo-600 border-t-transparent rounded-full animate-spin`}
    />
  );
}
