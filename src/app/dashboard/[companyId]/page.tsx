export default function DashboardPage({ params }: { params: { companyId: string } }) {
  return (
    <div style={{ padding: 24 }}>
      <h2>Dashboard</h2>
      <p>companyId: {params.companyId}</p>
    </div>
  );
}
