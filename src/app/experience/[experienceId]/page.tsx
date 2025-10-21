export default function ExperiencePage({ params }: { params: { experienceId: string } }) {
  return (
    <div style={{ padding: 24 }}>
      <h2>Experience</h2>
      <p>experienceId: {params.experienceId}</p>
    </div>
  );
}
