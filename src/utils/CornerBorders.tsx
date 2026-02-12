export const CornerBorders = (props: { className?: string }) => {
  return (
    <>
      {[
        'top-0 left-0 border-t-2 border-l-2',
        'top-0 right-0 border-t-2 border-r-2',
        'bottom-0 left-0 border-b-2 border-l-2',
        'bottom-0 right-0 border-b-2 border-r-2',
      ].map((string, index) => ( // the idea here is to map 4 divs to the absolute corners and give them borders
        <div key={index} className={`absolute border-white ${string} ${props.className || 'w-10 h-10'}`}/>
      ))}
    </>
  )
}