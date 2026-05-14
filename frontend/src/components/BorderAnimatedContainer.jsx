// How to make animated gradient border 👇
// https://cruip-tutorials.vercel.app/animated-gradient-border/
function BorderAnimatedContainer({ children }) {
  return (
    <div className="w-full h-full [background:linear-gradient(45deg,#2E1065,theme(colors.purple.900)_50%,#2E1065)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.purple.800/.48)_80%,_theme(colors.purple.500)_86%,_theme(colors.purple.300)_90%,_theme(colors.purple.500)_94%,_theme(colors.purple.800/.48))_border-box] rounded-2xl border border-transparent animate-border flex overflow-hidden">
      {children}
    </div>
  );
}
export default BorderAnimatedContainer;