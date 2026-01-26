'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { BoxArrowRight, Lock } from 'react-bootstrap-icons';

const NavBar: React.FC = () => {
  const { data: session, status } = useSession();
  const currentUser = session?.user?.email ?? '';
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Show a slim bar while session is loading
  if (status === 'loading') {
    return (
      <Navbar className="navandfooter" expand="lg">
        <Container>
          <Navbar.Brand as={Link} href="/">
            Kitchen Coordinator
          </Navbar.Brand>
        </Container>
      </Navbar>
    );
  }

  return (
    <Navbar className="navandfooter" expand="lg">
      <Container>
        <Navbar.Brand as={Link} href="/" className={pathname === '/' ? 'active' : undefined}>
          Kitchen Coordinator
        </Navbar.Brand>

        {session && (
          <>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto justify-content-start">
                <Nav.Link as={Link} id="dashboard-nav" href="/dashboard" active={isActive('/dashboard')}>
                  Dashboard
                </Nav.Link>
                <Nav.Link as={Link} id="view-pantry-nav" href="/view-pantry" active={isActive('/view-pantry')}>
                  View Pantry
                </Nav.Link>
                <Nav.Link as={Link} id="shopping-list-nav" href="/shopping-list" active={isActive('/shopping-list')}>
                  Shopping List
                </Nav.Link>
                <Nav.Link as={Link} id="recipe-nav" href="/recipes" active={isActive('/recipes')}>
                  Recipes
                </Nav.Link>
              </Nav>

              <Nav>
                <NavDropdown id="login-dropdown" title={currentUser}>
                  <NavDropdown.Item as={Link} id="login-dropdown-sign-out" href="/auth/signout">
                    <BoxArrowRight />
                    <span className="ms-2">Sign Out</span>
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} id="login-dropdown-change-password" href="/auth/change-password">
                    <Lock />
                    <span className="ms-2">Change Password</span>
                  </NavDropdown.Item>
                </NavDropdown>
              </Nav>
            </Navbar.Collapse>
          </>
        )}
      </Container>
    </Navbar>
  );
};

export default NavBar;
